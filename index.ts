#!/bin/sh
true /*; exec node -r ts-node/register/transpile-only "$0" "$@";*/;

/*const promisifyObject = (object: object) => new Proxy(object, {
    get(...a) {
        return promisify(Reflect.get(...a));
    }
});*/

import process from "process";
import puppeteer from "puppeteer";
import {promisify} from "util";
import child_process from "child_process";
const execFile = promisify(child_process.execFile);
import {promises as fs} from "fs";
const {stat} = fs;

const EAAS_PROXY_PATH = "./eaas-proxy";
const EAAS_PROXY_URL = "https://gitlab.com/emulation-as-a-service/eaas-proxy/-/jobs/artifacts/master/raw/eaas-proxy/eaas-proxy?job=build";

const [_url] = process.argv.slice(2);
const url = new URL(_url);
const { username, password } = url;

const xpathString = (string: string) =>
    `concat("","${string.replace(/"/g, '",\'"\',"')}")`;

const startsWithI = (expr: string, string: string) =>
    `starts-with(translate(normalize-space(${expr}),
    ${xpathString(string.toUpperCase())},
    ${xpathString(string.toLowerCase())}),
    ${xpathString(string.toLowerCase())})`;

const xpathStartsWithI = (string: string) =>
    `//text()[${startsWithI(".", string)}]/parent::*[
      name(.)!="script" and name(.)!="style"]`;

const xpathStartsWithIAfter = (string: string, before: string) =>
    `${xpathStartsWithI(before)}/following::*${xpathStartsWithI(string)}`;

const xpathStartsWithIBefore = (string: string, after: string) =>
    `(${xpathStartsWithI(after)}/preceding::*${xpathStartsWithI(string)})
      [position()=last()]`;

const evaluate = function*(expr: string) {
    const it = document.evaluate(expr, document);
    for (let val; (val = it.iterateNext()); yield val);
};

const timeout = (time_ms: number) => new Promise(r => setTimeout(r, time_ms));

// [...document.querySelectorAll("a, button")].filter(v => v.innerText.trim().toLowerCase().startsWith(string.toLowerCase()) && v.getBoundingClientRect().width !== 0)

class Page2 {
    constructor(public page: puppeteer.Page) {}
    async waitForString(string: string) {
        return this.page.waitForXPath(xpathStartsWithI(string));
    }
    async waitForStringAfter(string: string, before: string) {
        return this.page.waitForXPath(xpathStartsWithIAfter(string, before));
    }
    async waitForStringBefore(string: string, after: string) {
        return this.page.waitForXPath(xpathStartsWithIBefore(string, after));
    }
    async click(
        string: string,
        { before, after }: { before?: string; after?: string } = {}
    ) {
        const obj = await (after
            ? this.waitForStringAfter(string, after)
            : before
            ? this.waitForStringBefore(string, before)
            : this.waitForString(string));
        console.log(await obj.evaluate(v => v.outerHTML));
        obj.evaluate(v => (v.style.outline = "5px red solid"));
        await timeout(1000);
        obj.evaluate(v => ((v as HTMLElement).style.outline = "unset"));
        await obj.click();
    }
}

const run = (command: string, args: string[] = []) => {
    const process = child_process.spawn(command, args, {
        stdio: "inherit",
    });
    return new Promise((resolve, reject) => {
        process.on("error", reject);
        process.on("exit", resolve);
    });
}

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = new Page2(await browser.newPage());

    await page.page.authenticate({ username, password });
    await page.page.goto(String(url), { waitUntil: "networkidle2" });

    //  await page.click("import container");
    //  await page.click("choose a runtime");
    //  await page.click("docker");
    await page.click("environments");
    await page.click("networks");
    await page.click("choose action", { before: "tracenoizer" });
    await page.click("run");
    await timeout(1000);
    const eaasClient = await page.page.evaluateHandle(
        () =>
            angular.element(document.querySelector("[ui-view=wizard]")).scope()
                .startEmuCtrl.eaasClient
    );

    console.log(eaasClient);
    await page.click("Network Environment Overview");
    console.log("RUNNING");
    const proxyURL = await page.page.evaluate(eaasClient => {
        return eaasClient.getProxyURL({
            serverIP: "10.0.0.1",
            serverPort: "23",
            localPort: "8090"
        });
    }, eaasClient);
    console.log(proxyURL);
    if (!await stat(EAAS_PROXY_PATH).catch(()=>{})) {
        await run("curl", ["-L", "-o", EAAS_PROXY_PATH, EAAS_PROXY_URL]);
        await run("chmod", ["+x", EAAS_PROXY_PATH]);
    }
    await run(EAAS_PROXY_PATH, [proxyURL]);
    console.log("DONE");
})();
