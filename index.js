#!/bin/sh
true /*; exec node --experimental-modules "$0" "$@";*/

import process from "process";
import dgram from "dgram";
import stun from "stun";
import {promisify} from "util";

const defaultServers = ["stun.l.google.com:19302", "stun.sipgate.net"];

class StunSocket {
    socket = new dgram.Socket("udp4");
    async request(server) {
        const res = await promisify(stun.request)(server, {socket: this.socket});
        return res.getXorAddress() || res.getAddress();
    }
    get address() {
        return this.socket.address();
    }
}

const args = process.argv.slice(2);

(async () => {
    const stunServers = args.length ? args : defaultServers;
    const sock = new StunSocket;
    const req = await Promise.all(stunServers.map(v => sock.request(v)));
    for (const {address, port} of [sock.address, ...req]) {
        console.log(`${address}:${port}`);
    }
})().finally(() => process.exit());
