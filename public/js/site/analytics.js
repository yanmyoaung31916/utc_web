// Fire-and-forget visit tracking. Same endpoint/body as before.
export function trackVisit() {
  fetch("/api/analytics/visit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: location.pathname || "/" }),
  }).catch(() => {});
}
