// Shared fetch helper: try the live API first, fall back to static JSON.
export async function fetchWithFallback(apiPath, jsonPath) {
  try {
    const response = await fetch(apiPath);
    if (!response.ok) throw new Error("API not available");
    return await response.json();
  } catch (apiError) {
    console.log("API not available, using JSON file");
    const response = await fetch(jsonPath);
    return await response.json();
  }
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
