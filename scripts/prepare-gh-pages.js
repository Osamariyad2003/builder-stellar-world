import { copyFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const distPath = join('dist', 'spa');
const indexPath = join(distPath, 'index.html');
const notFoundPath = join(distPath, '404.html');
const nojekyllPath = join(distPath, '.nojekyll');

if (!existsSync(distPath)) {
  console.error('Error: dist/spa directory does not exist. Run build:client first.');
  process.exit(1);
}

// Copy index.html to 404.html for GitHub Pages SPA routing
if (existsSync(indexPath)) {
  copyFileSync(indexPath, notFoundPath);
  console.log('✓ Created 404.html for SPA routing');
} else {
  console.error('Error: index.html not found in dist/spa');
  process.exit(1);
}

// Create .nojekyll file to prevent Jekyll processing
writeFileSync(nojekyllPath, '');
console.log('✓ Created .nojekyll file');

console.log('✓ GitHub Pages preparation complete');

