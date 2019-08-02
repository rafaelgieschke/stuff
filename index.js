#!/bin/sh
true /*; exec node --experimental-modules "$0" "$@"; */;

import {promises as fs} from "fs";
import iCloud from "apple-icloud";
import prompt from "password-prompt";

(async () => {
const session = JSON.parse(await fs.readFile("session.json"));
console.log(session.username);
const myCloud = new iCloud("./session.json", session.username);

await new Promise((resolve, reject) => {
  myCloud.once("ready", resolve);
  myCloud.once("err", reject);
});

myCloud.on("progress", ev => {
  console.log(ev.zone.records);
});

await myCloud.Notes.getAll();
})().catch(console.error);
