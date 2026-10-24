const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { api, readLastOtp } = require("../helpers.cjs");

const ts = Date.now();
const plainUser = () => ({
  username: `suite_user_${ts}`,
  password: "Testpass123",
  role: "user",
  email: `suite_user_${ts}@example.com`,
  firstName: "Suite",
  lastName: "User",
});

describe("users + OTP", () => {
  let userId;

  it("creates a non-admin user immediately", async () => {
    const { data } = await api("POST", "/api/users", { body: plainUser(), expect: 201 });
    assert.ok(data.user.id);
    assert.equal(data.user.role, "user");
    userId = data.user.id;
  });

  it("rejects duplicate username/email with 409", async () => {
    await api("POST", "/api/users", { body: plainUser(), expect: 409 });
  });

  it("rejects weak passwords with 400", async () => {
    await api("PUT", `/api/users/${userId}/password`, {
      body: { newPassword: "weak" },
      expect: 400,
    });
  });

  it("resets a non-admin password immediately", async () => {
    await api("PUT", `/api/users/${userId}/password`, {
      body: { newPassword: "Newpass456" },
      expect: 200,
    });
  });

  it("updates a non-admin user immediately", async () => {
    const { data } = await api("PUT", `/api/users/${userId}`, {
      body: { firstName: "Renamed" },
      expect: 200,
    });
    assert.equal(data.message, "User updated successfully");
  });

  it("creates an admin via OTP two-step flow", async () => {
    const admin = { ...plainUser(), username: `suite_admin_${ts}`, email: `suite_admin_${ts}@example.com`, role: "admin" };
    const initiated = await api("POST", "/api/users", { body: admin, expect: 202 });
    assert.ok(initiated.data.otpId);

    const code = readLastOtp();
    const { data } = await api("POST", "/api/users/verify/create-admin", {
      body: { otpId: initiated.data.otpId, code },
      expect: 200,
    });
    assert.equal(data.user.username, admin.username);
  });

  it("rejects a wrong OTP code with 400", async () => {
    const admin = { ...plainUser(), username: `suite_admin2_${ts}`, email: `suite_admin2_${ts}@example.com`, role: "admin" };
    const initiated = await api("POST", "/api/users", { body: admin, expect: 202 });
    await api("POST", "/api/users/verify/create-admin", {
      body: { otpId: initiated.data.otpId, code: "xxxxxx" },
      expect: 400,
    });
  });

  it("prevents self-deletion with 400", async () => {
    const me = await api("GET", "/api/users/profile/me", { expect: 200 });
    await api("DELETE", `/api/users/${me.data.id}`, { expect: 400 });
  });

  it("returns 404 for unknown user", async () => {
    await api("GET", "/api/users/999999", { expect: 404 });
  });

  it("deletes the plain user", async () => {
    await api("DELETE", `/api/users/${userId}`, { expect: 200 });
  });
});
