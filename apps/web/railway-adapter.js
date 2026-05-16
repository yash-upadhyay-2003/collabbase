import { createServer } from 'http';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workerModulePath = path.resolve(
  __dirname,
  './dist/server/index.js'
);

const port = process.env.PORT || 3000;

createServer(async (req, res) => {
  try {
    const worker = (await import(workerModulePath)).default;

    const requestUrl = new URL(
      req.url,
      `http://${req.headers.host}`
    );

    const webRequest = new Request(requestUrl, {
      method: req.method,
      headers: req.headers,
      body:
        req.method !== 'GET' &&
        req.method !== 'HEAD'
          ? req
          : undefined,
      duplex: 'half'
    });

    const webResponse = await worker.fetch(
      webRequest,
      {},
      {}
    );

    webResponse.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });

    res.statusCode = webResponse.status;

    if (webResponse.body) {
      for await (const chunk of webResponse.body) {
        res.write(chunk);
      }
    }

    res.end();
  } catch (e) {
    console.error(e);

    res.writeHead(500, {
      'Content-Type': 'text/plain'
    });

    res.end('Internal Server Error');
  }
}).listen(port, () => {
  console.log(
    `Node.js server listening on http://localhost:${port}`
  );
});