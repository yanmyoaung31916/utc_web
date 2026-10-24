const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { api } = require("../helpers.cjs");

describe("analytics", () => {
  it("records a public visit", async () => {
    const { data } = await api("POST", "/api/analytics/visit", {
      token: null,
      body: { path: "/suite-probe" },
      expect: 200,
    });
    assert.equal(data.ok, true);
  });

  it("rejects unauthenticated reads with 401", async () => {
    await api("GET", "/api/analytics", { token: null, expect: 401 });
  });

  it("reads totals for admins", async () => {
    const { data } = await api("GET", "/api/analytics", { expect: 200 });
    assert.ok(data.totals.visits >= 1);
    assert.ok(data.today);
    assert.ok(Array.isArray(data.last7Days));
  });
});
