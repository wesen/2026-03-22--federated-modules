#!/usr/bin/env node

const url = process.argv[2];

if (!url) {
  console.error("Usage: node inspect-remote-entry.mjs <remote-entry-or-manifest-url>");
  process.exit(1);
}

const response = await fetch(url);
const body = await response.text();

console.log(`url: ${url}`);
console.log(`status: ${response.status} ${response.statusText}`);
console.log(`content-type: ${response.headers.get("content-type") ?? "unknown"}`);
console.log(`content-length: ${body.length} characters`);
console.log(`contains get(): ${body.includes("get(")}`);
console.log(`contains init(): ${body.includes("init(")}`);
console.log(`contains remoteEntry marker: ${body.includes("remoteEntry")}`);
console.log("--- preview ---");
console.log(body.slice(0, 800));
