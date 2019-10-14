#!/bin/sh
true /*; NODE_PATH="$(dirname -- "$(readlink "$0" || printf "%s" "$0")"
  )/node_modules" exec node -e \
  'require("esm")(module)(require("path").resolve(process.cwd(),
  process.argv[1]))' "$0" "$@"; */;

import process from "process";
import dgram from "dgram";
import stun from "stun";
import {promisify} from "util";
import fetch from "node-fetch";

const defaultServers = ["stun.l.google.com:19302", "stun.sipgate.net"];
const udpProxy = "https://ebenda.org/temp/send-udp";

if (!Promise.prototype.finally) {
  Promise.prototype.finally = function (f) {
    return this.then(f, f);
  };
}

class StunSocket {
    constructor() {
        this.socket = new dgram.Socket("udp4");
    }
    async request(server) {
        const res = await promisify(stun.request)(server, {socket: this.socket});
        return res.getXorAddress() || res.getAddress();
    }
    get address() {
        return this.socket.address();
    }
}

const args = process.argv.slice(2);

const once = (obj, type) => new Promise(r => obj.once(type, (...a) => r(a)));

(async () => {
    const stunServers = args.length ? args : defaultServers;
    const sock = new StunSocket;
    const req = await Promise.all(stunServers.map(v => sock.request(v)));
    for (const {address, port} of [sock.address, ...req]) {
        console.log(`${address}:${port}`);
    }
    fetch(`${udpProxy}?${new URLSearchParams({ip: req[0].address, port: req[0].port})}`);
    const [msg, rinfo] = await once(sock.socket, "message");
    console.log(msg);

})().catch(console.error).finally(() => process.exit());
