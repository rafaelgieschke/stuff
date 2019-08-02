#!/bin/sh
true /*; exec node --experimental-modules "$0" "$@"; */;

import iCloud from "apple-icloud";
import prompt from "password-prompt";
import {promises as fs} from "fs";

(async () => {
const username = await prompt("Username: ");
const password = await prompt("Password: ", {method: "hide"});

// const myCloud = new iCloud(session, username, password);
const myCloud = new iCloud("session.json", username, password);

myCloud.on("sessionUpdate", () => {
  myCloud.saveSession();
});

await new Promise((resolve, reject) => {
  myCloud.once("ready", resolve);
  myCloud.once("err", reject);
});

// await myCloud.saveSession("./session.json");
// await fs.writeFile("session.json", JSON.stringify(session));
})().catch(console.error);
