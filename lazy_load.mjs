import fs from 'fs';
import path from 'path';

function addLazyLoad(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  // Match <img tags that do not already contain loading="lazy" or loading="eager"
  // It handles arbitrary attributes before and after.
  let newContent = content.replace(/<img(?![^>]*\bloading=)[^>]*>/g, (match) => {
    return match.replace('<img', '<img loading="lazy"');
  });

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`Added lazy load to: ${filePath}`);
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      addLazyLoad(fullPath);
    }
  }
}

traverse('./src');
console.log('Lazy loading added in src/');
