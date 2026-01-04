////////// Using Map we have implemented the Caching  ///////////////////////



// const cache=new Map()
// const DEFAULT_TTL=30*1000
// const MAX_CACHE_SIZE=100

// function get(key){
//   const entry=cache.get(key)
//   if(!entry) return null
//   const isExpired=((Date.now()-entry.createdAt) > entry.ttl)
//   if(isExpired){
//     cache.delete(key)
//     console.log(`Cache is not missed but expired`)
//     return null;
//   }
//   console.log(`Cache is not missed and the data is upto date!!!`)
//   cache.delete(key);
//   cache.set(key, entry);
//   return entry;
// }

// function set(key,value,ttl=DEFAULT_TTL){
//   if(cache.has(key)){
//     cache.delete(key)
//   }

//   if(cache.size>=MAX_CACHE_SIZE){
//     const lruKey=cache.keys().next().value;
//     cache.delete(lruKey)
//   }
//   cache.set(key,{
//     ...value,
//     createdAt:Date.now(),
//     ttl
//   })
//   console.log(`The date is fed in the memory , cache miss!!!`)
// }

// function clear(){
//   cache.clear()
// }

// function size(){
//   return cache.size;
// }

// module.exports={
//   get,
//   set,
//   clear,
//   size
// }



//////////////// Using the Redis now we will cache.   /////////////////////////

const {client} = require('./redisclient');

const DEFAULT_TTL=30;

function makeKey(key){
  return `cache:${key}`
}

async function get(key){
  const value=await client.get(makeKey(key));
  if(!value){
    return null
  }
  return JSON.parse(value);
}

async function set(key,value,ttl=DEFAULT_TTL){
  await client.set(
    makeKey(key),
    JSON.stringify(value),
    {
      EX:ttl
    }
  );
};

async function clear(){
  const keys=await client.get('cache:*');
  if(keys.length>0){
    await client.del(keys);
  };
};

module.exports={
  get,
  set,
  clear
}

