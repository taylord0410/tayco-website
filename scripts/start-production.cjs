/* eslint @typescript-eslint/no-require-imports: "off" -- Container CommonJS bootstrap. */
/* Prepare Railway's root-owned mount, then keep the application unprivileged. */
const fs = require("node:fs");
const path = require("node:path");
if (process.platform !== "win32" && process.getuid() === 0) {
  const storage = path.resolve(__dirname, "..", ".data");
  fs.mkdirSync(storage, { recursive: true, mode: 0o700 });
  fs.chownSync(storage, 1001, 1001);
  process.setgroups([]);
  process.setgid(1001);
  process.setuid(1001);
}
require("../server.js");
