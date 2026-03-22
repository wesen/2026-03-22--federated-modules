#!/usr/bin/env node

import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const port = Number(process.env.PORT ?? 8080);
const baseUrl = `http://localhost:${port}`;
const server = spawn(process.execPath, ["./server/serve-demo.mjs"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: String(port)
  },
  stdio: ["ignore", "pipe", "pipe"]
});

function logStream(prefix, stream) {
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    process.stdout.write(`${prefix}${chunk}`);
  });
}

logStream("[server] ", server.stdout);
logStream("[server:err] ", server.stderr);

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/host/`);
      if (response.ok) {
        return;
      }
    } catch {
      // Retry until the server is ready.
    }

    await delay(250);
  }

  throw new Error("Timed out waiting for the demo server");
}

async function assertOk(pathname, predicate) {
  const response = await fetch(`${baseUrl}${pathname}`);
  if (!response.ok) {
    throw new Error(`Expected 200 from ${pathname}, got ${response.status}`);
  }

  const body = await response.text();
  if (predicate) {
    const result = predicate(body);
    if (result !== true) {
      throw new Error(typeof result === "string" ? result : `Validation failed for ${pathname}`);
    }
  }
}

try {
  await waitForServer();

  await assertOk("/host/", (body) =>
    body.includes("/host/assets/") || "Host HTML did not reference built assets under /host/assets/",
  );

  await assertOk("/registry/remotes.json", (body) =>
    body.includes('"checkout"') || "Registry payload did not include the checkout remote",
  );

  await assertOk("/remotes/checkout/remoteEntry.js", (body) =>
    body.length > 0 || "Remote entry was unexpectedly empty",
  );

  await assertOk("/remotes/checkout/mf-manifest.json", (body) =>
    body.includes('"metaData"') || "MF manifest did not contain expected metadata",
  );

  console.log("Smoke test passed");
} finally {
  server.kill("SIGTERM");
}
