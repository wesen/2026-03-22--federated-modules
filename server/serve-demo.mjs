#!/usr/bin/env node

import express from "express";
import path from "node:path";

const app = express();
const port = Number(process.env.PORT ?? 8080);
const rootDir = process.cwd();

const hostDistDir = path.join(rootDir, "apps/host/dist");
const remoteDistDir = path.join(rootDir, "apps/checkout-remote/dist");
const registryDir = path.join(rootDir, "registry");

app.get("/", (_req, res) => {
  res.redirect("/host/");
});

app.use("/registry", express.static(registryDir));
app.use("/remotes/checkout", express.static(remoteDistDir));
app.use("/host", express.static(hostDistDir));

app.listen(port, () => {
  console.log(`Demo server listening on http://localhost:${port}`);
  console.log(`Host: http://localhost:${port}/host/`);
  console.log(`Remote: http://localhost:${port}/remotes/checkout/`);
  console.log(`Registry: http://localhost:${port}/registry/remotes.json`);
});
