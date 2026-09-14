import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';

const ROOT = resolve(process.cwd());
const PORT = Number(process.env.PORT ?? 5599);
const HOST = process.env.HOST ?? '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function locate(rawUrl) {
  try {
    const url = new URL(rawUrl, 'http://localhost');
    const file = join(ROOT, decodeURIComponent(url.pathname));
    if (file !== ROOT && !file.startsWith(ROOT + sep)) return null;
    return { file, pathname: url.pathname, search: url.search };
  } catch {
    return null;
  }
}

http
  .createServer(async (req, res) => {
    const hit = locate(req.url);
    if (!hit) {
      res.writeHead(403).end();
      return;
    }
    try {
      let file = hit.file;
      if ((await stat(file)).isDirectory()) {
        if (!hit.pathname.endsWith('/')) {
          res.writeHead(302, { Location: `${hit.pathname}/${hit.search}` }).end();
          return;
        }
        file = join(file, 'index.html');
      }
      const data = await readFile(file);
      res.writeHead(200, {
        'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(data);
    } catch {
      res.writeHead(404).end('Not Found');
    }
  })
  .listen(PORT, HOST, () => {
    console.log(`readme builder: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/`);
  })
  .on('error', (err) => {
    console.error(err.code === 'EADDRINUSE' ? `port ${PORT} in use (run with PORT=<other>)` : err.message);
    process.exit(1);
  });
