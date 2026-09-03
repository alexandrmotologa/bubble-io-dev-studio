const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

function processIcon() {
  const inputPath = path.join(__dirname, '../build/icon.png');
  const buffer = fs.readFileSync(inputPath);
  const src = PNG.sync.read(buffer);

  const w = src.width;
  const h = src.height;
  const dst = new PNG({ width: w, height: h });

  const cx = w / 2;
  const cy = h / 2;
  // Size of the squircle
  const a = (w / 2) * 0.94; // 481px half-size, leaves safe padding
  const b = (h / 2) * 0.94;
  const n = 4.0; // Squircle superellipse degree (continuous Apple/Windows 11 curve)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;

      const nx = Math.abs(x + 0.5 - cx) / a;
      const ny = Math.abs(y + 0.5 - cy) / b;
      const dist = Math.pow(Math.pow(nx, n) + Math.pow(ny, n), 1 / n);

      // Base anti-aliasing width in normalized units
      const pixelUnit = 1.2 / a;
      let alphaMultiplier = 1.0;

      if (dist > 1.0 + pixelUnit) {
        alphaMultiplier = 0.0;
      } else if (dist > 1.0 - pixelUnit) {
        // Smooth linear transition between 0 and 1
        alphaMultiplier = (1.0 + pixelUnit - dist) / (2 * pixelUnit);
      }

      let r = src.data[idx];
      let g = src.data[idx + 1];
      let bVal = src.data[idx + 2];
      let origA = src.data[idx + 3] / 255;

      // Add a subtle sleek border highlight around the rim (0.985 to 1.0)
      if (dist >= 0.97 && dist <= 1.0) {
        const rimIntensity = Math.sin(((dist - 0.97) / 0.03) * Math.PI);
        // Subtle electric cyan/indigo rim glow
        r = Math.min(255, r + Math.round(rimIntensity * 60));
        g = Math.min(255, g + Math.round(rimIntensity * 140));
        bVal = Math.min(255, bVal + Math.round(rimIntensity * 180));
      }

      const finalA = Math.round(origA * alphaMultiplier * 255);

      dst.data[idx] = r;
      dst.data[idx + 1] = g;
      dst.data[idx + 2] = bVal;
      dst.data[idx + 3] = finalA;
    }
  }

  return dst;
}

// Bilinear downscaling for crisp mipmaps
function resizePNG(src, targetW, targetH) {
  const dst = new PNG({ width: targetW, height: targetH });
  const xRatio = src.width / targetW;
  const yRatio = src.height / targetH;

  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const px = x * xRatio;
      const py = y * yRatio;
      const xL = Math.floor(px);
      const yL = Math.floor(py);
      const xH = Math.min(src.width - 1, Math.ceil(px));
      const yH = Math.min(src.height - 1, Math.ceil(py));

      const xWeight = px - xL;
      const yWeight = py - yL;

      const idx00 = (yL * src.width + xL) * 4;
      const idx10 = (yL * src.width + xH) * 4;
      const idx01 = (yH * src.width + xL) * 4;
      const idx11 = (yH * src.width + xH) * 4;

      const dstIdx = (y * targetW + x) * 4;

      for (let c = 0; c < 4; c++) {
        const top = src.data[idx00 + c] * (1 - xWeight) + src.data[idx10 + c] * xWeight;
        const bottom = src.data[idx01 + c] * (1 - xWeight) + src.data[idx11 + c] * xWeight;
        dst.data[dstIdx + c] = Math.round(top * (1 - yWeight) + bottom * yWeight);
      }
    }
  }
  return dst;
}

function createICO(pngBuffers) {
  // pngBuffers: array of { width, height, buffer }
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = headerSize + count * dirEntrySize;

  let totalSize = dirSize;
  for (const item of pngBuffers) {
    totalSize += item.buffer.length;
  }

  const ico = Buffer.alloc(totalSize);

  // ICO Header
  ico.writeUInt16LE(0, 0); // Reserved
  ico.writeUInt16LE(1, 2); // 1 = ICO
  ico.writeUInt16LE(count, 4); // Number of images

  let currentOffset = dirSize;

  for (let i = 0; i < count; i++) {
    const item = pngBuffers[i];
    const entryOffset = headerSize + i * dirEntrySize;

    ico.writeUInt8(item.width === 256 ? 0 : item.width, entryOffset);
    ico.writeUInt8(item.height === 256 ? 0 : item.height, entryOffset + 1);
    ico.writeUInt8(0, entryOffset + 2); // Color palette
    ico.writeUInt8(0, entryOffset + 3); // Reserved
    ico.writeUInt16LE(1, entryOffset + 4); // Color planes
    ico.writeUInt16LE(32, entryOffset + 6); // Bits per pixel
    ico.writeUInt32LE(item.buffer.length, entryOffset + 8); // Image size in bytes
    ico.writeUInt32LE(currentOffset, entryOffset + 12); // File offset

    item.buffer.copy(ico, currentOffset);
    currentOffset += item.buffer.length;
  }

  return ico;
}

console.log('Processing rounded squircle icon...');
const roundedPng = processIcon();
const roundedBuffer1024 = PNG.sync.write(roundedPng);

// Save 1024x1024 rounded PNG
fs.writeFileSync(path.join(__dirname, '../build/icon.png'), roundedBuffer1024);
fs.writeFileSync(path.join(__dirname, '../public/icon.png'), roundedBuffer1024);
console.log('Saved build/icon.png and public/icon.png with smooth squircle corners.');

// Generate mipmap layers for ICO
const sizes = [256, 128, 64, 48, 32, 16];
const icoEntries = sizes.map(size => {
  const resized = size === 1024 ? roundedPng : resizePNG(roundedPng, size, size);
  const buf = PNG.sync.write(resized);
  return { width: size, height: size, buffer: buf };
});

const icoBuffer = createICO(icoEntries);
fs.writeFileSync(path.join(__dirname, '../build/icon.ico'), icoBuffer);
fs.writeFileSync(path.join(__dirname, '../public/favicon.ico'), icoBuffer);
console.log('Saved build/icon.ico and public/favicon.ico with multi-resolution rounded layers!');
