import http from 'http';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = process.argv[2] ?? 'public';
const port = Number(process.env.PORT ?? 5173);
const baseDir = path.resolve(__dirname, '..', rootDir);

const contentTypes = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname;
    const filePath = path.join(baseDir, requestedPath);
    const safePath = path.normalize(filePath);

    if (!safePath.startsWith(baseDir)) {
      res.writeHead(400);
      res.end('Bad request');
      return;
    }

    const data = await fs.readFile(safePath);
    const ext = path.extname(safePath);
    const contentType = contentTypes[ext] ?? 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (error) {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(port, () => {
  console.log(`RulesChat widget available at http://localhost:${port}`);
});
