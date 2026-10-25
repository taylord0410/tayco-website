"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

function resolveDataDir() {
  const preferred = "/app/.data";
  try {
    fs.mkdirSync(preferred, { recursive: true, mode: 0o700 });
    const probe = path.join(preferred, ".write-probe");
    fs.writeFileSync(probe, "ok");
    fs.unlinkSync(probe);
    return preferred;
  } catch {
    const fallback = "/tmp/tayco-data";
    fs.mkdirSync(fallback, { recursive: true, mode: 0o700 });
    return fallback;
  }
}

const dataDir = resolveDataDir();
if (!process.env.TAYCO_AUTH_DB_PATH || !process.env.TAYCO_AUTH_DB_PATH.startsWith(dataDir)) {
  process.env.TAYCO_AUTH_DB_PATH = path.join(dataDir, "tayco-auth.sqlite");
}
if (!process.env.TAYCO_ERP_DB_PATH || !process.env.TAYCO_ERP_DB_PATH.startsWith(dataDir)) {
  process.env.TAYCO_ERP_DB_PATH = path.join(dataDir, "tayco-erp.sqlite");
}

const child = spawn(process.execPath, ["server.js"], {
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
