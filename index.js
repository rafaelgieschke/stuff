#!/usr/bin/env node

import process from "node:process";
import dgram from "node:dgram";
import stun from "stun";
import {promisify} from "node:util";

const defaultServers = ["stun.l.google.com:19302", "stun.sipgate.net"];
const udpProxy = "https://ebenda.org/tmp/send-udp";

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
const timeout = time_ms => new Promise(r => setTimeout(r, time_ms));

(async () => {
    const stunServers = args.length ? args : defaultServers;
    const sock = new StunSocket;
    const req = await Promise.all(stunServers.map(v => sock.request(v).then(v2 => [v, v2])));
    for (const [server, {address, port}] of [["sock.address.alt", sock.address], ...req]) {
        console.log(`${server} ${address}:${port}`);
    }
    fetch(`${udpProxy}?${new URLSearchParams({ip: req[0].address, port: req[0].port})}`);
    try {
        const [msg, rinfo] = await Promise.race([once(sock.socket, "message"),
             timeout(2000).then(() => {throw "Timeout"})]);
        console.log(msg);
    } catch (e) {
        console.log(e);
    }

    sock.socket.send("+", 8080, new URL(udpProxy).hostname);
    await timeout(1000);
    fetch(`${udpProxy}?${new URLSearchParams({ip: req[0].address, port: req[0].port})}`);
    try {
        const [msg, rinfo] = await Promise.race([once(sock.socket, "message"),
             timeout(2000).then(() => {throw "Timeout"})]);
        console.log(msg);
    } catch (e) {
        console.log(e);
    }
})().catch(console.error).finally(() => process.exit());
