const wait = ms => new Promise(r => setTimeout(r, ms));

class WebSocketSource {
    /**
     *
     * @param {WebSocket} ws
     */
    constructor(ws) {
        this.ws = ws;
    }
    /**
     *
     * @param {ReadableStreamDefaultController} controller
     */
    start(controller) {
        this.controller = controller;
        this.ws.addEventListener("message", ev => {
            controller.enqueue(ev.data);
        });
    }
}

class WebSocketSink {
    /**
     * @param {WebSocket} ws
     * @param {number} bufferedTarget
     * @param {function(): number} speed
     *     Function to estimate the current connection speed in MB/s.
     */
    constructor(ws, bufferedTarget,
        speed = () => navigator.connection.downlink) {
        this.ws = ws;
        this.bufferedTarget = bufferedTarget;
        this.speed = speed;
    }
    async write(chunk) {
        for (; ;) {
            if (this.ws.bufferedAmount < this.bufferedTarget) {
                return this.ws.send(chunk);
            }
            const size_mb = (this.ws.bufferedAmount - this.bufferedTarget) / 1e6;
            const time_ms = (size_mb / this.speed()) * 1e3;
            await wait(time_ms / 10);
        }
    }
}

const _ws = new WeakMap;

class WebSocketStream {
    constructor(url, protocols, {
        binaryType = "blob",
    } = {}) {
        const ws = new WebSocket(url, protocols);
        _ws.set(this, ws);
        ws.binaryType = binaryType;
        setInterval(() => console.log(ws.bufferedAmount), 1000);
        // ws.addEventListener("open")

        const rStream = new ReadableStream(new WebSocketSource(ws));
        const wStream = new WritableStream(new WebSocketSink(ws, 5e6));
        return { readable: rStream, writable: wStream };
    }
}

export { WebSocketStream as default };
