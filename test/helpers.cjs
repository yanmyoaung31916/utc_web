// Shared helpers for the API test suite (runs via test/run.cjs).
// Uses the base URL + admin token injected by the runner.
const assert = require("node:assert/strict");

const BASE = process.env.TEST_BASE_URL || "http://localhost:3101";
const TOKEN = process.env.TEST_TOKEN;

async function api(method, path, { token = TOKEN, body, form, expect } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) {
    payload = form; // fetch sets the multipart boundary itself
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(BASE + path, { method, headers, body: payload });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON body (should not happen for this API)
  }
  if (expect !== undefined) {
    assert.equal(
      res.status,
      expect,
      `${method} ${path} -> expected ${expect}, got ${res.status}: ${JSON.stringify(data)}`
    );
  }
  return { status: res.status, data };
}

// Reads the 6-digit OTP from the most recent captured test email
// (stubbed in-memory by test/run.cjs - no SMTP involved).
// NOTE: matched against the code element specifically - the template's
// hex colors (e.g. #111827) also contain 6-digit runs, so a bare /(\d{6})//
// would grab the wrong one.
function readLastOtp() {
  const mails = globalThis.__TEST_MAILBOX__ || [];
  assert.ok(mails.length > 0, "expected at least one captured email");
  const match = String(mails[mails.length - 1].html).match(
    /letter-spacing:\s*6px[^>]*>\s*(\d{6})/
  );
  assert.ok(match, "no OTP code found in captured email");
  return match[1];
}

function pngBuffer() {
  // 1x1 transparent PNG
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
}

module.exports = { BASE, TOKEN, api, readLastOtp, pngBuffer };
