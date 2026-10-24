const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { api, pngBuffer } = require("../helpers.cjs");

function singleFileForm(filename, bytes, mime) {
  const form = new FormData();
  form.append("image", new Blob([bytes], { type: mime }), filename);
  return form;
}

describe("uploads", () => {
  it("rejects unauthenticated listing with 401", async () => {
    await api("GET", "/api/upload/files", { token: null, expect: 401 });
  });

  it("rejects unauthenticated upload with 401", async () => {
    await api("POST", "/api/upload/single", {
      token: null,
      form: singleFileForm("x.png", pngBuffer(), "image/png"),
      expect: 401,
    });
  });

  it("rejects non-image upload with 400", async () => {
    await api("POST", "/api/upload/single", {
      form: singleFileForm("evil.txt", Buffer.from("not an image"), "text/plain"),
      expect: 400,
    });
  });

  it("uploads, lists, and deletes an image", async () => {
    const uploaded = await api("POST", "/api/upload/single", {
      form: singleFileForm("suite-test.png", pngBuffer(), "image/png"),
      expect: 200,
    });
    assert.ok(uploaded.data.url.startsWith("/uploads/"));
    assert.equal(uploaded.data.filename, uploaded.data.url.replace("/uploads/", ""));

    const listed = await api("GET", "/api/upload/files", { expect: 200 });
    assert.ok(listed.data.some((f) => f.filename === uploaded.data.filename));

    await api("DELETE", `/api/upload/${uploaded.data.filename}`, { expect: 200 });
    await api("DELETE", `/api/upload/${uploaded.data.filename}`, { expect: 404 });
  });

  it("uploads multiple images at once", async () => {
    const form = new FormData();
    form.append("images", new Blob([pngBuffer()], { type: "image/png" }), "m1.png");
    form.append("images", new Blob([pngBuffer()], { type: "image/png" }), "m2.png");
    const { data } = await api("POST", "/api/upload/multiple", { form, expect: 200 });
    assert.equal(data.files.length, 2);
    for (const f of data.files) {
      await api("DELETE", `/api/upload/${f.filename}`, { expect: 200 });
    }
  });
});
