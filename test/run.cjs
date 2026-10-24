// Test entrypoint. Run via `npm test` (optionally `npm test -- <name>` to
// run only matching suite files).
//
// Everything runs in ONE process: backup live state, boot the real server on
// a test port against a FRESH database (deterministic admin seed), stub
// outgoing mail in-memory so OTP flows work without SMTP, import the suites,
// then restore live state in an `after()` hook.
const fs = require("node:fs");
const path = require("node:path");
const { after } = require("node:test");

const ROOT = path.join(__dirname, "..");
const DB = path.join(ROOT, "database.db");
const DATA_FILES = ["courses.json", "services.json", "contact.json", "analytics.json"].map(
  (f) => path.join(ROOT, "data", f)
);
const UPLOADS = path.join(ROOT, "uploads");
const MAILBOX = [];
globalThis.__TEST_MAILBOX__ = MAILBOX;

const bakPath = (f) => `${f}.testbak`;
const uploadsBefore = new Set(fs.existsSync(UPLOADS) ? fs.readdirSync(UPLOADS) : []);
const PROGRESS = path.join(ROOT, "test-progress.log");
if (fs.existsSync(PROGRESS)) fs.unlinkSync(PROGRESS);
const mark = (m) => fs.appendFileSync(PROGRESS, `${Date.now()} ${m}\n`);

// Backup first so after() can always restore, even if setup throws.
for (const f of [DB, ...DATA_FILES]) {
  if (fs.existsSync(bakPath(f))) fs.copyFileSync(bakPath(f), f); // recover from a crashed run
}
for (const f of [DB, ...DATA_FILES]) {
  if (fs.existsSync(f)) fs.copyFileSync(f, bakPath(f));
}

function restoreLiveState() {
  // Synchronous on purpose: --test-force-exit must not race it.
  // Safe wrt SQLite: the server's handle points at the (deleted) fresh-test
  // file, so replacing the live path cannot be clobbered on close.
  for (const f of [DB, ...DATA_FILES]) {
    if (fs.existsSync(bakPath(f))) {
      fs.copyFileSync(bakPath(f), f);
      fs.unlinkSync(bakPath(f));
    } else if (f === DB && fs.existsSync(DB)) {
      fs.unlinkSync(DB); // no live DB existed before the run
    }
  }
  if (fs.existsSync(UPLOADS)) {
    for (const f of fs.readdirSync(UPLOADS)) {
      if (!uploadsBefore.has(f)) fs.unlinkSync(path.join(UPLOADS, f));
    }
  }
}

after(() => {
  restoreLiveState();
  mark("restore done");
});

async function main() {
  if (fs.existsSync(DB)) fs.unlinkSync(DB); // fresh DB -> deterministic admin seed

  process.env.PORT = "3101";
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-only-secret-do-not-use-in-production";
  process.env.JWT_EXPIRES_IN = "24h";
  process.env.ADMIN_USERNAME = "testadmin";
  process.env.ADMIN_PASSWORD = "Testpass123";

  // Stub nodemailer before the server loads it: capture mails in memory.
  const mailerPath = require.resolve("nodemailer");
  require(mailerPath);
  require.cache[mailerPath].exports = {
    createTransport: () => ({
      sendMail: async (opts) => {
        MAILBOX.push({ to: opts.to, subject: opts.subject, html: opts.html });
        return { messageId: `test-${MAILBOX.length}` };
      },
    }),
  };

  require("../server.js");

  // Wait for boot, then log in ONCE - /api/auth/login allows only
  // 5 attempts per 15 min per IP (account lockout would break the suite).
  const deadline = Date.now() + 15000;
  let token = null;
  while (Date.now() < deadline && !token) {
    try {
      const health = await fetch("http://localhost:3101/api/health");
      if (health.ok) {
        await new Promise((r) => setTimeout(r, 800)); // let the admin seed finish
        for (let i = 0; i < 3 && !token; i++) {
          const res = await fetch("http://localhost:3101/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: "testadmin", password: "Testpass123" }),
          });
          if (res.ok) token = (await res.json()).token;
          else await new Promise((r) => setTimeout(r, 1000));
        }
      } else {
        await new Promise((r) => setTimeout(r, 300));
      }
    } catch {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  if (!token) throw new Error("test server did not become ready (seed login failed)");
  mark("seed login ok");

  process.env.TEST_BASE_URL = "http://localhost:3101";
  process.env.TEST_TOKEN = token;

  const only = process.argv[2];
  const suites = [
    "auth.test.cjs",
    "courses.test.cjs",
    "services.test.cjs",
    "contact.test.cjs",
    "upload.test.cjs",
    "users.test.cjs",
    "analytics.test.cjs",
  ].filter((f) => !only || f.includes(only));
  for (const f of suites) await import(`./suite/${f}`);
  mark("all suites imported");
}

main().catch((err) => {
  console.error("test setup error:", err.message);
  process.exitCode = 1;
});
