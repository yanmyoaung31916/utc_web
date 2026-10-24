const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { api } = require("../helpers.cjs");

const newService = () => ({
  title: "Test Service",
  description: "A service created by the test suite.",
  images: { image1: "/uploads/a.png", image2: "/uploads/b.png", image3: "/uploads/c.png" },
  outlines: ["Step one"],
});

describe("services", () => {
  it("lists services publicly", async () => {
    const { data } = await api("GET", "/api/admin/services", { token: null, expect: 200 });
    assert.ok(Array.isArray(data));
  });

  it("rejects unauthenticated creation with 401", async () => {
    await api("POST", "/api/admin/services", { token: null, body: newService(), expect: 401 });
  });

  it("rejects missing images object with 400", async () => {
    const { title, description } = newService();
    await api("POST", "/api/admin/services", { body: { title, description }, expect: 400 });
  });

  it("completes a create/read/update/delete round-trip", async () => {
    const before = await api("GET", "/api/admin/services", { token: null, expect: 200 });

    const created = await api("POST", "/api/admin/services", { body: newService(), expect: 201 });
    assert.ok(created.data.id);

    const fetched = await api("GET", `/api/admin/services/${created.data.id}`, {
      token: null,
      expect: 200,
    });
    assert.equal(fetched.data.description, newService().description);

    const updated = await api("PUT", `/api/admin/services/${created.data.id}`, {
      body: { ...newService(), title: "Renamed Service" },
      expect: 200,
    });
    assert.equal(updated.data.title, "Renamed Service");

    await api("DELETE", `/api/admin/services/${created.data.id}`, { expect: 200 });
    await api("GET", `/api/admin/services/${created.data.id}`, { token: null, expect: 404 });

    const after = await api("GET", "/api/admin/services", { token: null, expect: 200 });
    assert.equal(after.data.length, before.data.length);
  });
});
