
`docker run --rm -v "$PWD/CONFIG.js:/CONFIG.js" -p 8090:8090 hayd/distroless-deno run --allow-net --allow-read https://raw.githubusercontent.com/rafaelgieschke/stuff/pdns-cf-proxy/index.ts file:///CONFIG.js`
