const http = require("http");
const https = require("https");
const { URL } = require("url");
const cache = require("./cache");

function getCacheKey(req) {
  return `${req.method}:${req.url}`;
}

function isCacheableMethod(method) {
  return method === "GET" || method === "HEAD";
}
function hasAuthHeaders(req) {
  return Boolean(
    req.headers["authorization"] ||
    req.headers["cookie"]
  );
}

function forwardWithoutCache(clientReq,clientRes,origin){
  const originURL=new URL(origin);
  const options={
    protocol:originURL.protocol,
    hostname:originURL.hostname,
    path:clientReq.url,
    method:clientReq.method,
    port: originUrl.port || (originUrl.protocol === "https:" ? 443 : 80),
    headers:{
      ...clientReq.headers,
      host:originURL.host
    }
  };
  const transport=originURL.protocol==='https:'?https:http
  const proxyReq=transport.request(options,(proxyRes)=>{
    clientRes.writeHead(proxyRes.statusCode,{
      ...proxyRes.headers,
      "X-Cache": "BYPASS",
    });
    proxyRes.pipe(clientRes);
  });
  clientReq.pipe(proxyReq);
}


function forwardRequest(clientReq, clientRes, origin) {
  
  // 🚫 Do not cache unsafe methods
  if (!isCacheableMethod(clientReq.method) || hasAuthHeaders(clientReq)) {
    console.log(`Caching is not allowed for this method or it contains auth!!!!`)
  return forwardWithoutCache(clientReq, clientRes, origin);
  }

  const cacheKey = getCacheKey(clientReq);
  const cachedResponse = cache.get(cacheKey);

  // 🟢 CACHE HIT
  if (cachedResponse) {
    clientRes.writeHead(cachedResponse.statusCode, {
      ...cachedResponse.headers,
      "X-Cache": "HIT",
    });
    console.log(`We got the cache, it is cache hit!!`)
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

      const cacheControl = proxyRes.headers["cache-control"];

      const shouldCache =
        !cacheControl ||
        (!cacheControl.includes("no-store") &&
        !cacheControl.includes("no-cache") &&
        !cacheControl.includes("private"));

      // Store in cache
      if (shouldCache) {
        console.log(`We should respect the cache controller`)
        cache.set(cacheKey, {
          statusCode: proxyRes.statusCode,
          headers: proxyRes.headers,
          body,
        });
      }

      clientRes.writeHead(proxyRes.statusCode, {
        ...proxyRes.headers,
        "X-Cache": shouldCache ? "MISS" : "BYPASS",
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
