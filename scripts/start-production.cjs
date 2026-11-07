"use strict";
/* eslint @typescript-eslint/no-require-imports: "off" -- Container CommonJS bootstrap. */
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { prepareDataDir } = require("./data-dir.cjs");

// Fails loudly on Railway instead of falling back to /tmp (see scripts/data-dir.cjs).
const { dir: dataDir, persistent } = prepareDataDir();
process.env.TAYCO_DATA_PERSISTENT = persistent ? "1" : "0";
if (!process.env.TAYCO_AUTH_DB_PATH || !process.env.TAYCO_AUTH_DB_PATH.startsWith(dataDir)) {
  process.env.TAYCO_AUTH_DB_PATH = path.join(dataDir, "tayco-auth.sqlite");
}
if (!process.env.TAYCO_ERP_DB_PATH || !process.env.TAYCO_ERP_DB_PATH.startsWith(dataDir)) {
  process.env.TAYCO_ERP_DB_PATH = path.join(dataDir, "tayco-erp.sqlite");
}
process.env.HOSTNAME = "0.0.0.0";
if (process.env.RAILWAY_ENVIRONMENT_ID && !process.env.TAYCO_TRUSTED_INGRESS) {
  process.env.TAYCO_TRUSTED_INGRESS = "railway-public-edge";
}

let entryServer = "server.js";
if (!fs.existsSync(path.join(process.cwd(), "server.js")) && fs.existsSync(path.join(process.cwd(), ".next", "standalone", "server.js"))) {
  const standaloneDir = path.join(process.cwd(), ".next", "standalone");
  const standalonePublic = path.join(standaloneDir, "public");
  const standaloneStatic = path.join(standaloneDir, ".next", "static");
  if (!fs.existsSync(standalonePublic) && fs.existsSync(path.join(process.cwd(), "public"))) {
    fs.cpSync(path.join(process.cwd(), "public"), standalonePublic, { recursive: true });
  }
  if (!fs.existsSync(standaloneStatic) && fs.existsSync(path.join(process.cwd(), ".next", "static"))) {
    fs.mkdirSync(path.dirname(standaloneStatic), { recursive: true });
    fs.cpSync(path.join(process.cwd(), ".next", "static"), standaloneStatic, { recursive: true });
  }
  entryServer = path.join(".next", "standalone", "server.js");
}

const child = spawn(process.execPath, [entryServer], {
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
