#!/bin/sh
true /*; exec node --experimental-modules "$0" "$@";*/

import process from "process";
import puppeteer from "puppeteer";

const [_url] = process.argv.slice(2);
const url = new URL(_url);
const {username, password} = url;

(async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.authenticate({username, password});
  await page.goto(url);
})();
