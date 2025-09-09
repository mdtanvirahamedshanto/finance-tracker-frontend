// Simple build script for Vercel deployment
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name equivalent to __dirname in CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the build directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Run the build command
console.log('Building the application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
  
  // Copy necessary files for PWA
  console.log('Ensuring PWA files are in place...');
  
  // Verify service worker is in the dist directory
  const swSource = path.join(__dirname, 'public', 'service-worker.js');
  const swDest = path.join(distDir, 'service-worker.js');
  
  if (fs.existsSync(swSource) && !fs.existsSync(swDest)) {
    fs.copyFileSync(swSource, swDest);
    console.log('Copied service-worker.js to dist directory');
  }
  
  console.log('Build process completed!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}