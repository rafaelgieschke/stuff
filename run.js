#!/bin/sh
true /*; exec node --experimental-modules "$0" "$@";*/

import process from "process";
import puppeteer from "puppeteer";

const [_url] = process.argv.slice(2);
const url = new URL(_url);
const {username, password} = url;

const xpathString = string =>
  `concat("","${string.replace(/"/g, "\",'\"',\"")}")`;

const startsWithI = (expr, string) =>
  `starts-with(translate(normalize-space(${expr}),
    ${xpathString(string.toUpperCase())},
    ${xpathString(string.toLowerCase())}),
    ${xpathString(string.toLowerCase())})`

const xpathStartsWithI = string =>
  `//text()[${startsWithI(".", string)}]/parent::*[
      name(.)!="script" and name(.)!="style"]`;

const xpathStartsWithIAfter = (string, before) =>
  `${xpathStartsWithI(before)}/following::*${xpathStartsWithI(string)}`;

const xpathStartsWithIBefore = (string, after) =>
  `(${xpathStartsWithI(after)}/preceding::*${xpathStartsWithI(string)})
      [position()=last()]`;

const evaluate = function* (expr) {
  const it = document.evaluate(expr, document);
  for (let val; val = it.iterateNext(); yield val);
}

const timeout = time_ms => new Promise(r => setTimeout(r, time_ms));

class Page2 {
  constructor(page) {
    this.page = page;
  }
  async waitForString(string) {
    return this.page.waitForXPath(xpathStartsWithI(string));
  }
  async waitForStringAfter(string, before) {
    return this.page.waitForXPath(xpathStartsWithIAfter(string, before));
  }
  async waitForStringBefore(string, after) {
    return this.page.waitForXPath(xpathStartsWithIBefore(string, after));
  }
  async click(string, {before, after} = {}) {
    const obj = await (after ?
      this.waitForStringAfter(string, after) :
      before ? this.waitForStringBefore(string, before) :
        this.waitForString(string));
    console.log(await obj.evaluate(v => v.outerHTML));
    obj.evaluate(v => v.style.outline = "5px red solid");
    await timeout(500);
    obj.evaluate(v => v.style.outline = "unset");
    await obj.click();
  }
}

(async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = new Page2(await browser.newPage());

  await page.page.authenticate({username, password});
  await page.page.goto(url, {waitUntil: "networkidle2"});
  //  await page.click("import container");
  //  await page.click("choose a runtime");
  //  await page.click("docker");
  await page.click("environments");
  await page.click("networks");
  await page.click("choose action", {before: "tracenoizer"});
  await page.click("run");
  await timeout(1000);
  const eaasClient = await page.page.evaluateHandle(
    () => angular.element(document.querySelector("[ui-view=wizard]")).scope().startEmuCtrl.eaasClient);
  console.log(eaasClient);
  console.log("DONE");
})();
