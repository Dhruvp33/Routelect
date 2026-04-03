import sharp from 'sharp';
import fs from 'fs';

async function generate() {
  const svgBuffer = fs.readFileSync('./public/routelect-logo.svg');
  
  // 192x192 regular (transparent background)
  await sharp(svgBuffer)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile('./public/icon-192.png');

  // 512x512 regular
  await sharp(svgBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile('./public/icon-512.png');

  // 192x192 maskable (solid dark bg with padding so it isn't cropped)
  await sharp(svgBuffer)
    .resize(130, 130, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 31, bottom: 31, left: 31, right: 31, background: '#070B14' })
    .png()
    .toFile('./public/icon-192-maskable.png');

  // 512x512 maskable (solid dark bg with padding)
  await sharp(svgBuffer)
    .resize(360, 360, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 76, bottom: 76, left: 76, right: 76, background: '#070B14' })
    .png()
    .toFile('./public/icon-512-maskable.png');

  // apple-touch-icon (180x180, solid dark bg to support iOS properly)
  await sharp(svgBuffer)
    .resize(140, 140, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 20, bottom: 20, left: 20, right: 20, background: '#070B14' })
    .png()
    .toFile('./public/apple-touch-icon.png');

  // apple-touch-icon for light mode (optional - Apple has limited support, but useful for some fallback contexts)
  await sharp(svgBuffer)
    .resize(140, 140, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 20, bottom: 20, left: 20, right: 20, background: '#ffffff' })
    .png()
    .toFile('./public/apple-touch-icon-light.png');

  console.log("Generated all PWA icons successfully!");
}

generate().catch(console.error);
