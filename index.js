import(import.meta.url).then(m => Object.assign(window, m));

import WebSocketStream from "./websocketstream.js";

console.log = (...e) => {
  out.textContent += e + "\n";  
};

let i = 0;
export const endlessStream = new ReadableStream({
    
    pull(controller) {
        // const a = new Uint8Array(10e3);
        // controller.enqueue(crypto.getRandomValues(a));
        controller.enqueue(new Uint8Array(10e3));
        //controller.enqueue(i++);
    },
}, {highWaterMark: 10});

export const ws = new WebSocketStream("ws:localhost:8080");

setTimeout(() => 
endlessStream.pipeTo(ws.writable), 1000);
