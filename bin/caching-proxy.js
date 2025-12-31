#!/usr/bin/env node

const { Command } = require('commander');
const program = new Command();
const { startServer } = require("../src/server");


program
  .name("caching-proxy")
  .description("A simple HTTP caching proxy server")
  .option("--port <number>","port to run the proxy server")
  .option("--origin <url>","origing URL server")
  .option("--clear-cache","clear the cache")
  .parse(process.argv)

const options=program.opts()

//Mode 1 : Clear Cache

if(options.clearCache){
  console.log("The Cache is cleared")
  process.exit(0)
}

// Mode 2: Start the proxy server

if(!options.port||!options.origin){
  console.error("Error: --port and --origin are required to start the proxy")
  program.exit(1)
}

const port=Number(options.port)
const origin=options.origin

if(isNaN(port)){
  console.error("Error: --port must be a number")
  program.exit(1)
}

console.log("Starting caching proxy");
console.log(`Port: ${port}`);
console.log(`Origin: ${origin}`);

startServer(port, origin);



