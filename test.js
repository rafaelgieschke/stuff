const {original_dst} = require("./build/Release/obj.target/original_dst.node");
const net = require("net");

const getDst = socket => original_dst(socket._handle.fd);

net.createServer(c => {
  console.log(getDst(c));
}).listen(8080);
