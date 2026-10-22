const { getDefaultConfig } = require('expo/metro-config');
const https = require('https');

const config = getDefaultConfig(__dirname);

const originalEnhanceMiddleware = config.server?.enhanceMiddleware;

config.server = config.server || {};
config.server.enhanceMiddleware = (metroMiddleware, metroServer) => {
  return (req, res, next) => {
    if (req.url && req.url.startsWith('/api/')) {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => {
        const bodyBuffer = Buffer.concat(chunks);
        const headers = { ...req.headers };
        
        headers.host = 'uni-calc-backend.onrender.com';
        headers.origin = 'http://localhost:5173';
        headers.referer = 'http://localhost:5173/';
        delete headers['accept-encoding']; // Prevent proxy decompression mismatch

        if (bodyBuffer.length > 0) {
          headers['content-length'] = Buffer.byteLength(bodyBuffer);
        }

        const options = {
          hostname: 'uni-calc-backend.onrender.com',
          port: 443,
          path: req.url,
          method: req.method,
          headers,
          timeout: 45000,
        };

        const proxyReq = https.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res, { end: true });
        });

        proxyReq.on('error', (err) => {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Proxy connection error: ' + err.message }));
        });

        proxyReq.on('timeout', () => {
          proxyReq.destroy();
          res.writeHead(504, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Render backend took too long to respond (Cold Start).' }));
        });

        if (bodyBuffer.length > 0) {
          proxyReq.write(bodyBuffer);
        }
        proxyReq.end();
      });
      return;
    }

    if (originalEnhanceMiddleware) {
      return originalEnhanceMiddleware(metroMiddleware, metroServer)(req, res, next);
    }
    return metroMiddleware(req, res, next);
  };
};

module.exports = config;
