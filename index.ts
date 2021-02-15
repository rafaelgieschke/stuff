#!/usr/bin/env -S deno run --allow-net

import { serve, ServerRequest } from "https://deno.land/std/http/server.ts";
import { CloudlfareClient } from "./cloudflare-client.ts";
import config from "./CONFIG.js";

console.log(config);
const domains = config.domains as Record<string, {zoneId: string, token: string}>;

const d = (v: any) => (console.debug(v), v);

const client = new CloudlfareClient(config.zoneId, config.token);
console.log(await client.list());

const server = serve({ hostname: "0.0.0.0", port: 8090 });

const xApiKey = config.pdns_key;

const getClient = (name: string) => {
  const domain = name.split(".").slice(-2).join(".");
  const {zoneId, token} = domains[domain];
  return new CloudlfareClient(zoneId, token);
};

const createRecord = async (
  name: string,
  type: string,
  content: string,
  ttl: number = 1
) => {
  const client = getClient(name);
  await client.createOrUpdateRecord(name, type, content, ttl);
  // HACK: Delete a ACME dns-01 challenge entry after a timeout
  if (type === "TXT" && content.startsWith("_acme-challenge.")) {
    setTimeout(() => {
      try {
        client.deleteRecord(name, type);
      } catch {}
    }, 3600_000);
  }
};

const deleteRecord = async (name: string, type: string) => {
  const client = getClient(name);
  await client.deleteRecord(name, type);
};

const handleRequest = async (request: ServerRequest) => {
  if (request.headers.get("x-api-key") != xApiKey) {
    request.respond({ status: 401, body: "Unauthorized\n" });
    return;
  }
  const url = new URL(request.url, "https://invalid.invalid/");
  const path = url.pathname.replace(/\/+$/, "");
  if (path === "/api/v1/servers/localhost/zones") {
    const body = `[{"account": "", "dnssec": false, "id": "=2E", "kind": "Native", "last_check": 0, "masters": [], "name": ".", "notified_serial": 20190628, "serial": 0, "url": "api/v1/servers/localhost/zones/=2E"}]`;
    return request.respond({ status: 200, body: `${body}\n` });
  }
  if (request.method === "PATCH") {
    const json = JSON.parse(
      new TextDecoder().decode(await Deno.readAll(request.body))
    );
    let {
      rrsets: [{ changetype, name, type, ttl, records: [{ content }] = [] }],
    } = json;
    console.log({ changetype, name, type, ttl, content });
    name = name.replace(/\.$/, "");
    if (changetype === "REPLACE") await createRecord(name, type, content, ttl);
    if (changetype === "DELETE") await deleteRecord(name, type);
    return request.respond({ status: 200, body: "{}\n" });
  }
  return request.respond({ status: 200, body: "{}\n" });
};

for await (const request of server) {
  handleRequest(request).catch((e) => {
    console.log("Request error", e);
    try {
      request.respond({ status: 500 });
    } catch {}
  });
}
