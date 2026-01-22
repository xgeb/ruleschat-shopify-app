import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const distDir = path.join(projectRoot, 'dist');

const copyRecursive = async (source, destination) => {
  const entries = await fs.readdir(source, { withFileTypes: true });
  await fs.mkdir(destination, { recursive: true });

  await Promise.all(
    entries.map(async (entry) => {
      const sourcePath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);

      if (entry.isDirectory()) {
        await copyRecursive(sourcePath, destPath);
        return;
      }

      await fs.copyFile(sourcePath, destPath);
    })
  );
};

const build = async () => {
  await fs.rm(distDir, { recursive: true, force: true });
  await copyRecursive(publicDir, distDir);
  console.log('Build complete: dist/');
};

build();
