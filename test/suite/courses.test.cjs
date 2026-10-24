const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { api } = require("../helpers.cjs");

const newCourse = () => ({
  title: "Test Course",
  level: "Basic",
  image: "/uploads/test.png",
  alt: "Test Course",
  outlines: ["Topic one", "Topic two"],
});

describe("courses", () => {
  it("lists courses publicly", async () => {
    const { data } = await api("GET", "/api/admin/courses", { token: null, expect: 200 });
    assert.ok(Array.isArray(data));
  });

  it("rejects unauthenticated creation with 401", async () => {
    await api("POST", "/api/admin/courses", { token: null, body: newCourse(), expect: 401 });
  });

  it("rejects invalid payload with 400", async () => {
    await api("POST", "/api/admin/courses", { body: { title: "" }, expect: 400 });
  });

  it("returns 404 for unknown course", async () => {
    await api("GET", "/api/admin/courses/definitely-not-here", { token: null, expect: 404 });
  });

  it("completes a create/read/update/delete round-trip", async () => {
    const before = await api("GET", "/api/admin/courses", { token: null, expect: 200 });

    const created = await api("POST", "/api/admin/courses", { body: newCourse(), expect: 201 });
    assert.ok(created.data.id);
    assert.equal(created.data.title, "Test Course");

    const fetched = await api("GET", `/api/admin/courses/${created.data.id}`, {
      token: null,
      expect: 200,
    });
    assert.equal(fetched.data.title, "Test Course");

    const updated = await api("PUT", `/api/admin/courses/${created.data.id}`, {
      body: { ...newCourse(), title: "Renamed Course" },
      expect: 200,
    });
    assert.equal(updated.data.title, "Renamed Course");

    const afterCreate = await api("GET", "/api/admin/courses", { token: null, expect: 200 });
    assert.equal(afterCreate.data.length, before.data.length + 1);

    await api("DELETE", `/api/admin/courses/${created.data.id}`, { expect: 200 });
    await api("GET", `/api/admin/courses/${created.data.id}`, { token: null, expect: 404 });

    const afterDelete = await api("GET", "/api/admin/courses", { token: null, expect: 200 });
    assert.equal(afterDelete.data.length, before.data.length);
  });
});
