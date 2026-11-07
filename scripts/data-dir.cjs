"use strict";
/* eslint @typescript-eslint/no-require-imports: "off" -- Container CommonJS bootstrap. */
/* Prepare the private data directory for the production launcher.
 *
 * Railway mounts volumes root-owned (docs/railway-review.md). With RAILWAY_RUN_UID=0 the launcher
 * starts as root: it hands the mount to the application user (UID/GID 1001) and drops privileges
 * before Next loads. On Railway the data directory must be the persistent volume: falling back to
 * /tmp would silently lose accounts, sessions and guest records on every restart, so it fails loudly.
 */
const nodeFs = require("node:fs");
const path = require("node:path");

const PERSISTENT_DATA_DIR = "/app/.data";
const EPHEMERAL_DATA_DIR = "/tmp/tayco-data";
const APP_UID = 1001;
const APP_GID = 1001;

function onRailway(env) {
  return Boolean(env.RAILWAY_ENVIRONMENT || env.RAILWAY_ENVIRONMENT_ID);
}

function isRoot(proc) {
  return proc.platform !== "win32" && typeof proc.getuid === "function" && proc.getuid() === 0;
}

function canWrite(fs, dir) {
  try {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const probe = path.join(dir, ".write-probe");
    fs.writeFileSync(probe, "ok");
    fs.unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}

/** The Docker image chowns the application to UID 1001; a root-owned build (e.g. Railpack) is not dropped. */
function appOwnedByAppUser(fs, appRoot) {
  try {
    return fs.statSync(path.join(appRoot, "package.json")).uid === APP_UID;
  } catch {
    return false;
  }
}

/**
 * Returns { dir, persistent, droppedPrivileges }. Order matters: hand the mount to the app user and
 * drop privileges first, then probe, so the probe proves the unprivileged server can write.
 */
function prepareDataDir({
  env = process.env,
  fs = nodeFs,
  proc = process,
  appRoot = process.cwd(),
  preferred = PERSISTENT_DATA_DIR,
  fallback = EPHEMERAL_DATA_DIR,
} = {}) {
  let droppedPrivileges = false;
  if (isRoot(proc) && !appOwnedByAppUser(fs, appRoot)) {
    console.warn("[tayco] running as root with a root-owned build: privileges are NOT dropped (the build would be unreadable/unwritable for UID 1001).");
  } else if (isRoot(proc)) {
    try {
      fs.mkdirSync(preferred, { recursive: true, mode: 0o700 });
      fs.chownSync(preferred, APP_UID, APP_GID);
      for (const entry of fs.readdirSync(preferred)) {
        try { fs.chownSync(path.join(preferred, entry), APP_UID, APP_GID); } catch {}
      }
    } catch {
      // The probe below decides; a failed handover is reported there.
    }
    proc.setgroups([]);
    proc.setgid(APP_GID);
    proc.setuid(APP_UID);
    droppedPrivileges = true;
  }

  if (canWrite(fs, preferred)) return { dir: preferred, persistent: true, droppedPrivileges };

  if (onRailway(env)) {
    throw new Error(
      `[tayco] ${preferred} is not writable by the application user. Refusing to fall back to ${fallback} on Railway: ` +
        "accounts, sessions and guest records would be lost on every restart. Mount the volume at " +
        `${preferred} and set RAILWAY_RUN_UID=0 so the launcher can hand it to UID ${APP_UID}.`,
    );
  }

  fs.mkdirSync(fallback, { recursive: true, mode: 0o700 });
  return { dir: fallback, persistent: false, droppedPrivileges };
}

module.exports = { prepareDataDir, onRailway, PERSISTENT_DATA_DIR, EPHEMERAL_DATA_DIR, APP_UID, APP_GID };
