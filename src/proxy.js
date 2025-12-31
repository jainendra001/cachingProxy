const http=require('http')
const https=require('https')
const URL=require('url')


function forwardRequest(req,res,origin){
  const originURL=new URL(origin)
  const options={
    protocol:originURL.protocol,
    hostname:originURL.hostname,
    port:originURL.port || (originURL.protocol==='https:'?443:80),
    method: req.method,
    path:req.url,
    headers:{
      ...req.headers,
      host: originURL.host
    },

  }

  const transport = originUrl.protocol === "https:" ? https : http;
  const proxyReq= transport.request(options,(proxyRes)=>{
    res.writeHead(proxyRes.statusCode,proxyRes.headers)
    proxyRes.pipe(res);
  })
  req.pipe(proxyReq)
  proxyReq.on("error", (err) => {
    console.error("Proxy error:", err.message);
    res.writeHead(502);
    res.end("Bad Gateway");
  });
}

module.exports = { forwardRequest };