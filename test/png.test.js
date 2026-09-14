import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deflateSync } from 'node:zlib';
import { decodePng } from '../src/png.js';
import { toAscii, fromAscii } from '../src/ascii.js';

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, body) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
  return Buffer.concat([head, body, crc]);
}

function encodePng(rgba, filters = []) {
  const height = rgba.length;
  const width = rgba[0].length;

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    const type = filters[y] ?? 0;
    const base = y * (stride + 1);
    raw[base] = type;
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < 4; c++) {
        const value = rgba[y][x][c];
        const i = base + 1 + x * 4 + c;
        if (type === 0) raw[i] = value;
        else if (type === 1) raw[i] = (value - (x ? rgba[y][x - 1][c] : 0)) & 0xff;
        else if (type === 2) raw[i] = (value - (y ? rgba[y - 1][x][c] : 0)) & 0xff;
        else throw new Error(`filter unknown to the test encoder: ${type}`);
      }
    }
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const R = [255, 31, 66, 255];
const W = [255, 179, 193, 255];
const _ = [0, 0, 0, 0];

const HEART = [
  [_, _, _, _, _],
  [_, R, _, R, _],
  [_, R, W, R, _],
  [_, _, R, _, _],
  [_, _, _, _, _],
];

test('decodes an RGBA PNG to pixels', () => {
  const { width, height, pixels } = decodePng(encodePng(HEART));
  assert.equal(width, 5);
  assert.equal(height, 5);
  assert.deepEqual([...pixels.subarray(4, 8)], [0, 0, 0, 0], '(1,0) is transparent');
  assert.deepEqual([...pixels.subarray((1 * 5 + 1) * 4, (1 * 5 + 1) * 4 + 4)], R, '(1,1) is red');
});

test('undoes the Sub and Up filters', () => {
  for (const type of [1, 2]) {
    const { pixels } = decodePng(encodePng(HEART, Array(5).fill(type)));
    const at = (x, y) => [...pixels.subarray((y * 5 + x) * 4, (y * 5 + x) * 4 + 4)];
    assert.deepEqual(at(1, 1), R, `filter ${type}`);
    assert.deepEqual(at(2, 2), W, `filter ${type}`);
    assert.deepEqual(at(0, 0), [0, 0, 0, 0], `filter ${type}`);
  }
});

test('rejects non-PNG input', () => {
  assert.throws(() => decodePng(Buffer.from('not a png at all!!')), /not a PNG file/);
});

test('trims transparent margins and emits dot strings', () => {
  const { rows, palette, trimmed } = toAscii(decodePng(encodePng(HEART)));
  assert.deepEqual(trimmed, { width: 3, height: 3 });
  assert.deepEqual(rows, ['X.X', 'XYX', '.X.']);
  assert.equal(palette.X, '#ff1f42', 'the most used color gets the first letter');
  assert.equal(palette.Y, '#ffb3c1');
});

test('decoding back matches the source pixels', () => {
  const { rows, palette } = toAscii(decodePng(encodePng(HEART)));
  const back = fromAscii(rows, palette);
  assert.equal(back.size, 6, '6 opaque pixels');
  assert.equal(back.get('1,1'), '#ffb3c1');
  assert.equal(back.get('0,0'), '#ff1f42');
  assert.equal(back.get('0,2'), undefined, 'transparent spots stay empty');
});

test('translucent pixels binarize at the alpha cutoff, with a warning', () => {
  const half = [255, 31, 66, 100];
  const { rows, warnings } = toAscii(decodePng(encodePng([[R, half], [half, R]])));
  assert.deepEqual(rows, ['X.', '.X'], 'alpha below 128 is transparent');
  assert.ok(warnings.some((w) => w.includes('translucent')));
});

test('rejects a fully transparent image', () => {
  assert.throws(() => toAscii(decodePng(encodePng([[_, _], [_, _]]))), /no opaque pixels/);
});

test('fromAscii ignores letters outside the palette', () => {
  assert.equal(fromAscii(['XQ'], { X: '#ffffff' }).size, 1);
  assert.equal(fromAscii(['X X'], { X: '#ffffff' }).size, 2, 'spaces are transparent');
});
