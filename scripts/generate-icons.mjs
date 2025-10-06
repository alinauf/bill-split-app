import sharp from 'sharp';
import { readFileSync } from 'fs';

const sizes = [192, 512];

const svgBuffer = readFileSync('public/icon.svg');

for (const size of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(`public/icon-${size}x${size}.png`);

  console.log(`Generated icon-${size}x${size}.png`);
}

console.log('All icons generated successfully!');
