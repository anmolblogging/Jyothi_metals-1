import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesDir = path.join(__dirname, 'public', 'images');

async function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      await processDirectory(fullPath);
    } else if (fullPath.match(/\.(png|jpe?g)$/i)) {
      const ext = path.extname(fullPath);
      const newPath = fullPath.substring(0, fullPath.length - ext.length) + '.webp';
      
      try {
        console.log(`Converting ${fullPath} to WebP...`);
        // Resize very large images max width 1200px while maintaining aspect ratio, and convert to WebP
        await sharp(fullPath)
          .resize({ width: 1200, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(newPath);
          
        fs.unlinkSync(fullPath);
      } catch (err) {
        console.error(`Error processing ${fullPath}:`, err);
      }
    }
  }
}

processDirectory(imagesDir).then(() => console.log('Done!')).catch(console.error);
