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
if (!process.env.HOSTNAME) {
  process.env.HOSTNAME = "0.0.0.0";
}
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
