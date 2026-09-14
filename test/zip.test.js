import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crc32, makeZip } from '../src/zip.js';

const enc = new TextEncoder();
const dec = new TextDecoder();

function readEntries(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocd = bytes.length - 22;
  assert.equal(view.getUint32(eocd, true), 0x06054b50, 'end of central directory missing');
  const count = view.getUint16(eocd + 10, true);
  let at = view.getUint32(eocd + 16, true);

  const entries = [];
  for (let i = 0; i < count; i++) {
    assert.equal(view.getUint32(at, true), 0x02014b50, 'central header missing');
    const crc = view.getUint32(at + 16, true);
    const size = view.getUint32(at + 20, true);
    const nameLen = view.getUint16(at + 28, true);
    const local = view.getUint32(at + 42, true);
    const name = dec.decode(bytes.subarray(at + 46, at + 46 + nameLen));

    assert.equal(view.getUint32(local, true), 0x04034b50, `${name}: local header missing`);
    const localNameLen = view.getUint16(local + 26, true);
    const start = local + 30 + localNameLen;
    entries.push({ name, crc, data: bytes.subarray(start, start + size) });
    at += 46 + nameLen;
  }
  return entries;
}

test('crc32 matches the reference value', () => {
  assert.equal(crc32(enc.encode('hello')), 0x3610a686);
  assert.equal(crc32(new Uint8Array()), 0);
});

test('a zip lists every file, with the bytes and checksums intact', async () => {
  const files = [
    { name: 'README.md', data: '# hi\n' },
    { name: 'links/blog.svg', data: '<svg/>' },
    { name: 'bin', data: new Uint8Array([0, 1, 2, 255]) },
  ];
  const bytes = new Uint8Array(await makeZip(files).arrayBuffer());
  const got = readEntries(bytes);

  assert.deepEqual(got.map((e) => e.name), files.map((f) => f.name));
  assert.equal(dec.decode(got[0].data), '# hi\n');
  assert.equal(dec.decode(got[1].data), '<svg/>');
  assert.deepEqual([...got[2].data], [0, 1, 2, 255]);
  for (const e of got) assert.equal(e.crc, crc32(e.data), `${e.name}: checksum`);
});

test('an empty zip is still a valid archive', async () => {
  const bytes = new Uint8Array(await makeZip([]).arrayBuffer());
  assert.equal(bytes.length, 22);
  assert.deepEqual(readEntries(bytes), []);
});
