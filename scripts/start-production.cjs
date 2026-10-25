/* eslint @typescript-eslint/no-require-imports: "off" -- Container CommonJS bootstrap. */
/* Prepare Railway's root-owned mount, then keep the application unprivileged. */
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const storage = path.join(root, ".data");
fs.mkdirSync(storage, { recursive: true, mode: 0o700 });

const seedDir = path.join(root, "private-operator-inputs", "takeoff");
const seedMarker = path.join(storage, ".seed-20261024-v2");
try {
  const authSeed = path.join(seedDir, "auth-seed.dbbin");
  const erpSeed = path.join(seedDir, "erp-seed.dbbin");
  if (fs.existsSync(authSeed) && fs.existsSync(erpSeed) && !fs.existsSync(seedMarker)) {
    const authDest = process.env.TAYCO_AUTH_DB_PATH || path.join(storage, "tayco-auth.sqlite");
    const erpDest = process.env.TAYCO_ERP_DB_PATH || path.join(storage, "tayco-erp.sqlite");
    for (const f of [authDest, authDest + "-wal", authDest + "-shm", erpDest, erpDest + "-wal", erpDest + "-shm"]) {
      try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {}
    }
    fs.copyFileSync(authSeed, authDest);
    fs.copyFileSync(erpSeed, erpDest);
    fs.writeFileSync(seedMarker, new Date().toISOString());
  }
} catch (err) {
  console.error("Seed check warning:", err && err.message ? err.message : err);
}

if (process.platform !== "win32" && process.getuid() === 0) {
  fs.chownSync(storage, 1001, 1001);
  for (const entry of fs.readdirSync(storage)) {
    try { fs.chownSync(path.join(storage, entry), 1001, 1001); } catch {}
  }
  process.setgroups([]);
  process.setgid(1001);
  process.setuid(1001);
}
require("../server.js");
