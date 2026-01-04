const http=require("http")
const {forwardRequest}=require("./proxy")
const {connectRedis}=require('./redisclient')

async function startServer(port,origin){
  await connectRedis();
  const server=http.createServer((req,res)=>{
    forwardRequest(req,res,origin);
  });
  //delay for proxy server
  setTimeout(()=>{
        server.listen(port,()=>{
        console.log(`✅ Proxy server running on port ${port}`);
      })
  },5000)
}

module.exports={startServer};