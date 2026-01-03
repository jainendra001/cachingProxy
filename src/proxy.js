const http = require("http");
const https = require("https");
const { URL } = require("url");
const cache = require("./cache");

function getCacheKey(req) {
  return `${req.method}:${req.url}`;
}

function forwardRequest(clientReq, clientRes, origin) {
  const cacheKey = getCacheKey(clientReq);
  const cachedResponse = cache.get(cacheKey);

  // 🟢 CACHE HIT
  if (cachedResponse) {
    clientRes.writeHead(cachedResponse.statusCode, {
      ...cachedResponse.headers,
      "X-Cache": "HIT",
    });

    clientRes.end(cachedResponse.body);
    return;
  }

  // 🔴 CACHE MISS
  const originUrl = new URL(origin);

  const options = {
    protocol: originUrl.protocol,
    hostname: originUrl.hostname,
    port: originUrl.port || (originUrl.protocol === "https:" ? 443 : 80),
    method: clientReq.method,
    path: clientReq.url,
    headers: {
      ...clientReq.headers,
      host: originUrl.host,
      "user-agent": "caching-proxy/1.0",
    },
  };

  const transport = originUrl.protocol === "https:" ? https : http;

  const proxyReq = transport.request(options, (proxyRes) => {
    const chunks = [];

    proxyRes.on("data", (chunk) => {
      chunks.push(chunk);
    });

    proxyRes.on("end", () => {
      const body = Buffer.concat(chunks);

      // Store in cache
      cache.set(cacheKey, {
        statusCode: proxyRes.statusCode,
        headers: proxyRes.headers,
        body,
      });

      clientRes.writeHead(proxyRes.statusCode, {
        ...proxyRes.headers,
        "X-Cache": "MISS",
      });

      clientRes.end(body);
    });
  });

  clientReq.pipe(proxyReq);

  proxyReq.on("error", (err) => {
    console.error("❌ Proxy error:", err.message);
    clientRes.writeHead(502);
    clientRes.end("Bad Gateway");
  });
}

module.exports = { forwardRequest };
