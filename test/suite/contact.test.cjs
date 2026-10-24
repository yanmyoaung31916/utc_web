const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { api } = require("../helpers.cjs");

describe("contact", () => {
  it("reads contact info publicly", async () => {
    const { data } = await api("GET", "/api/admin/contact", { token: null, expect: 200 });
    assert.ok(data.email);
  });

  it("rejects unauthenticated update with 401", async () => {
    await api("PUT", "/api/admin/contact", { token: null, body: {}, expect: 401 });
  });

  it("updates and persists contact info", async () => {
    const original = await api("GET", "/api/admin/contact", { token: null, expect: 200 });

    const payload = {
      ...original.data,
      title: "Test Title",
      email: "test@example.com",
    };
    const updated = await api("PUT", "/api/admin/contact", { body: payload, expect: 200 });
    assert.equal(updated.data.title, "Test Title");

    const reread = await api("GET", "/api/admin/contact", { token: null, expect: 200 });
    assert.equal(reread.data.title, "Test Title");
    // live state is restored from backup by the runner afterwards
  });
});
