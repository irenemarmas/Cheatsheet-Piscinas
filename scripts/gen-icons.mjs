/**
 * gen-icons.mjs — Generate PWA icons as PNG + SVG.
 * No external dependencies. Uses Node built-in zlib for PNG compression.
 *
 * Usage: node scripts/gen-icons.mjs
 * Output: assets/icons/icon.svg, icon-192.png, icon-512.png,
 *         apple-touch-icon.png (180×180), favicon-32.png
 */

import fs   from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const ROOT  = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT   = path.join(ROOT, 'assets', 'icons');
fs.mkdirSync(OUT, { recursive: true });

// ── SVG icon — water-drop mark on deep-teal background ───────────────────────
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#08394a"/>
  <!-- Water-drop shape (original art) -->
  <path d="M256 80 C256 80 140 240 140 320
           a116 116 0 0 0 232 0
           C372 240 256 80 256 80Z"
        fill="#1391b0"/>
  <!-- Inner highlight -->
  <ellipse cx="220" cy="310" rx="28" ry="42"
           fill="rgba(255,255,255,0.22)" transform="rotate(-20 220 310)"/>
  <!-- Wave line -->
  <path d="M176 370 Q200 350 224 370 Q248 390 272 370 Q296 350 320 370"
        stroke="rgba(255,255,255,0.5)" stroke-width="8"
        stroke-linecap="round" fill="none"/>
</svg>`;

fs.writeFileSync(path.join(OUT, 'icon.svg'), SVG);
console.log('✓ icon.svg');

// ── PNG generator (pure Node, no deps) ───────────────────────────────────────
// Renders a simple coloured square icon matching the SVG design.

function crc32(buf) {
  const table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c;
    }
    return t;
  })();
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function u32be(n) {
  const b = Buffer.allocUnsafe(4);
  b.writeUInt32BE(n, 0);
  return b;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const crcInput  = Buffer.concat([typeBytes, data]);
  return Buffer.concat([u32be(data.length), typeBytes, data, u32be(crc32(crcInput))]);
}

/**
 * Render the icon at size×size:
 *   - deep teal background (#08394a)
 *   - centred water-drop triangle in accent teal (#1391b0)
 * Pure rasteriser — no canvas, no deps.
 */
function renderIcon(size) {
  // Colours
  const BG   = [0x08, 0x39, 0x4a, 0xff];
  const DROP  = [0x13, 0x91, 0xb0, 0xff];
  const HI   = [0xff, 0xff, 0xff, 0x38]; // white semi-transparent highlight

  // Radius for rounded-rect background
  const R  = Math.round(size * 0.15625); // ~80/512

  // Drop path bounding box: centred, roughly 0.45× wide, 0.67× tall
  const dw = size * 0.45;
  const dh = size * 0.67;
  const dx = (size - dw) / 2;
  const dy = size * 0.135;

  // Apex of drop (top-centre)
  const ax = size / 2;
  const ay = dy;
  // Bottom circle centre
  const cy = dy + dh * 0.62;
  const cr = dw / 2; // radius of bottom circle

  function inRoundedRect(x, y) {
    const px = Math.abs(x - size / 2);
    const py = Math.abs(y - size / 2);
    const lx = size / 2 - R;
    const ly = size / 2 - R;
    if (px > size / 2 || py > size / 2) return false;
    if (px <= lx || py <= ly) return true;
    const qx = px - lx, qy = py - ly;
    return qx * qx + qy * qy <= R * R;
  }

  // Is (x,y) inside the water-drop silhouette?
  // Drop = union of: triangle (apex → bottom-circle tangent points) + bottom circle
  function inDrop(x, y) {
    // Bottom circle
    const dcx = size / 2;
    const inCircle = (x - dcx) * (x - dcx) + (y - cy) * (y - cy) <= cr * cr;
    if (inCircle) return true;
    // Triangle: apex at (ax, ay), widens linearly to circle diameter at cy
    if (y < ay || y > cy) return false;
    const t    = (y - ay) / (cy - ay); // 0 at apex, 1 at cy
    const halfW = cr * t;
    return Math.abs(x - ax) <= halfW;
  }

  // Highlight ellipse (rotated ~−20°)
  function inHighlight(x, y) {
    const hcx = size * 0.43, hcy = cy - size * 0.022;
    const hrx = cr * 0.28, hry = cr * 0.42;
    const angle = -20 * Math.PI / 180;
    const dx2 = x - hcx, dy2 = y - hcy;
    const rx2 = dx2 * Math.cos(angle) + dy2 * Math.sin(angle);
    const ry2 = -dx2 * Math.sin(angle) + dy2 * Math.cos(angle);
    return (rx2 / hrx) * (rx2 / hrx) + (ry2 / hry) * (ry2 / hry) <= 1;
  }

  // Build raw pixel data: RGBA rows
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.allocUnsafe(1 + size * 4); // filter byte + pixels
    row[0] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      let px;
      if (!inRoundedRect(x, y)) {
        px = [0, 0, 0, 0]; // transparent outside rounded rect
      } else if (inDrop(x, y)) {
        if (inHighlight(x, y)) {
          // Blend highlight over drop colour
          const a = HI[3] / 255;
          px = [
            Math.round(DROP[0] * (1 - a) + HI[0] * a),
            Math.round(DROP[1] * (1 - a) + HI[1] * a),
            Math.round(DROP[2] * (1 - a) + HI[2] * a),
            255,
          ];
        } else {
          px = DROP;
        }
      } else {
        px = BG;
      }
      row[1 + x * 4 + 0] = px[0];
      row[1 + x * 4 + 1] = px[1];
      row[1 + x * 4 + 2] = px[2];
      row[1 + x * 4 + 3] = px[3];
    }
    rows.push(row);
  }

  const raw  = Buffer.concat(rows);
  const comp = zlib.deflateSync(raw, { level: 9 });

  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8]  = 8;  // bit depth
  ihdr[9]  = 6;  // colour type: RGBA
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', comp),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

const sizes = [
  { name: 'icon-512.png',         size: 512 },
  { name: 'icon-192.png',         size: 192 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32.png',       size: 32  },
];

for (const { name, size } of sizes) {
  console.log(`  Rendering ${size}×${size}…`);
  const png = renderIcon(size);
  fs.writeFileSync(path.join(OUT, name), png);
  console.log(`✓ ${name} (${png.length} bytes)`);
}

console.log('\n✅ Icons generated in assets/icons/');
