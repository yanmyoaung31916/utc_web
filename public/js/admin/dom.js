// Small DOM / form helpers shared by admin feature modules.
export const $ = (id) => document.getElementById(id);

export const getValue = (id) => $(id)?.value ?? "";

export function setValue(id, value) {
  const el = $(id);
  if (el) el.value = value ?? "";
}

export function getLines(id) {
  return getValue(id)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function setLines(id, values) {
  setValue(id, (values || []).join("\n"));
}

export function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value ?? "";
}

// Escape user-controlled strings interpolated into innerHTML templates.
export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
