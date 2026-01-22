import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const requiredFiles = ['public/index.html', 'public/widget.css', 'public/widget.js'];

const lint = async () => {
  const missing = [];

  await Promise.all(
    requiredFiles.map(async (file) => {
      try {
        await fs.access(path.join(projectRoot, file));
      } catch {
        missing.push(file);
      }
    })
  );

  if (missing.length > 0) {
    console.error(`Missing required files: ${missing.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  console.log('Lint passed: required files exist.');
};

lint();
