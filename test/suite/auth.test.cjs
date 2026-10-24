const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { api } = require("../helpers.cjs");

describe("auth", () => {
  it("health check reports OK", async () => {
    const { data } = await api("GET", "/api/health", { token: null, expect: 200 });
    assert.equal(data.status, "OK");
  });

  it("rejects unknown username with 401", async () => {
    await api("POST", "/api/auth/login", {
      token: null,
      body: { username: "no_such_user", password: "whatever123" },
      expect: 401,
    });
  });

  it("rejects short credentials with 400", async () => {
    await api("POST", "/api/auth/login", {
      token: null,
      body: { username: "ab", password: "x" },
      expect: 400,
    });
  });

  it("verifies the runner token", async () => {
    const { data } = await api("GET", "/api/auth/verify", { expect: 200 });
    assert.equal(data.valid, true);
    assert.equal(data.user.username, "testadmin");
  });

  it("rejects missing token with 401", async () => {
    await api("GET", "/api/auth/verify", { token: null, expect: 401 });
  });

  it("logs out", async () => {
    const { data } = await api("POST", "/api/auth/logout", { expect: 200 });
    assert.equal(data.message, "Logout successful");
  });
});
