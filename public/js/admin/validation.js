// Shared validation. Same rule as the backend user routes:
// min 8 chars, at least one lower, upper, and digit (routes/users.js).
export function isStrongPassword(password = "") {
  if (password.length < 8 || password.length > 128) return false;
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
}
