import { createServer } from 'node:http';
import { resolve, join } from 'node:path';
import { statSync, createReadStream } from 'node:fs';
import mime from 'mime';

import serverBundle from './dist/server/server.js';

const PORT = process.env.PORT || 3000;
const CLIENT_DIR = resolve(process.cwd(), 'dist/client');

// Very minimal Node HTTP to Web Request adapter
function createWebRequest(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || 'localhost';
  const url = new URL(req.url, `${protocol}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      value.forEach(v => headers.append(key, v));
    } else if (value) {
      headers.set(key, value);
    }
  }

  const init = {
    method: req.method,
    headers,
  };

  // Node req is a ReadableStream. To bridge it to fetch, if there's a body:
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = new ReadableStream({
      start(controller) {
        req.on('data', chunk => controller.enqueue(chunk));
        req.on('end', () => controller.close());
        req.on('error', err => controller.error(err));
      }
    });
    // Required by Node fetch for ReadableStream body
    init.duplex = 'half';
  }

  return new Request(url, init);
}

const server = createServer(async (req, res) => {
  try {
    // 1. Try to serve static asset from dist/client
    if (req.method === 'GET' || req.method === 'HEAD') {
      try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const filePath = join(CLIENT_DIR, url.pathname);
        
        // Prevent directory traversal
        if (filePath.startsWith(CLIENT_DIR)) {
          const stat = statSync(filePath);
          if (stat.isFile()) {
            const mimeType = mime.getType(filePath) || 'application/octet-stream';
            res.writeHead(200, {
              'Content-Type': mimeType,
              'Content-Length': stat.size,
            });
            if (req.method === 'HEAD') {
              return res.end();
            }
            return createReadStream(filePath).pipe(res);
          }
        }
      } catch (e) {
        // File not found, ignore and fall through to SSR
      }
    }

    // 2. Delegate to TanStack Start SSR fetch handler
    const webReq = createWebRequest(req);
    const webRes = await serverBundle.fetch(webReq);

    // 3. Send back Web Response via Node HTTP
    const resHeaders = {};
    webRes.headers.forEach((value, key) => {
      if (resHeaders[key]) {
        if (Array.isArray(resHeaders[key])) {
          resHeaders[key].push(value);
        } else {
          resHeaders[key] = [resHeaders[key], value];
        }
      } else {
        resHeaders[key] = value;
      }
    });

    res.writeHead(webRes.status, resHeaders);

    if (webRes.body) {
      const reader = webRes.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Server error:', error);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`Node HTTP adapter listening on port ${PORT}`);
});
