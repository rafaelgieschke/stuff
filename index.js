import WebSocket from "ws";

const DEBUG = process.env.DEBUG === "1";
if (DEBUG) console.debug("DEBUG mode enabled");
if (!DEBUG) console.debug = () => {};

const wss = new WebSocket.Server({
  port: 8080,
});

const channels = new Map();

const channelInfo = channels => [...channels]
  .map(([k, v]) => [k, [...v].map(v => 1)]);

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, "wss://invalid.invalid/");
  const ch = url.pathname;

  console.log("connection", ch);
  if (!channels.has(ch)) channels.set(ch, new Set());
  channels.get(ch).add(ws);

  ws.on("message", m => {
    if (DEBUG && ch === "/@@channels") m = JSON.stringify(channelInfo(channels));
    console.debug("message", m);
    for (const c of channels.get(ch)) try {
      c.send(m);
    } catch {}
  });
  ws.on("close", () => channels.get(ch).delete(ws));
});
