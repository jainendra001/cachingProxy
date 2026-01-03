const cache=new Map()
const DEFAULT_TTL=30*1000

function get(key){
  const entry=cache.get(key)
  if(!entry) return null
  const isExpired=((Date.now()-entry.createdAt) > entry.ttl)
  if(isExpired){
    cache.delete(key)
    console.log(`Cache is not missed but expired`)
    return null;
  }
  console.log(`Cache is not missed and the data is upto date!!!`)
  return entry;
}

function set(key,value,ttl=DEFAULT_TTL){
  cache.set(key,{
    ...value,
    createdAt:Date.now(),
    ttl
  })
  console.log(`The date is fed in the memory , cache miss!!!`)
}

function clear(){
  cache.clear()
}

module.exports={
  get,
  set,
  clear
}