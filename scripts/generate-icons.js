// Simple icon generation script
// You can use online tools like https://www.favicon-generator.org/
// or https://realfavicongenerator.net/ to generate proper PWA icons from icon.svg

console.log(`
To generate PWA icons, you can:

1. Use an online tool:
   - Visit: https://realfavicongenerator.net/
   - Upload: public/icon.svg
   - Generate and download icons
   - Place icon-192x192.png and icon-512x512.png in public/

2. Use ImageMagick (if installed):
   convert public/icon.svg -resize 192x192 public/icon-192x192.png
   convert public/icon.svg -resize 512x512 public/icon-512x512.png

3. Use an online PWA asset generator:
   - Visit: https://www.pwabuilder.com/imageGenerator
   - Upload your icon and generate all required sizes
`);
