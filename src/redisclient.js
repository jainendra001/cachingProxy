const {createClient}=require('redis');
const client=createClient({
  url: "redis://localhost:6379"
});
client.on('error',(err)=>{
  console.error(`redis error : ${err}`)
});

async function connectRedis(){
  if(!client.isOpen){
    await client.connect();
    console.log('Redis is connected');
  }
};

module.exports={
  client,
  connectRedis
}


