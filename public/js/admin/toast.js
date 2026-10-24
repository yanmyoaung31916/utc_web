// Toast notifications. Extracted verbatim from AdminPanel.showToast.
const COLORS = {
  success: "bg-green-500",
  error: "bg-red-500",
  warning: "bg-yellow-500",
  info: "bg-blue-500",
};

const ICONS = {
  success: "fas fa-check-circle",
  error: "fas fa-exclamation-circle",
  warning: "fas fa-exclamation-triangle",
  info: "fas fa-info-circle",
};

export function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `${COLORS[type] || COLORS.info} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 fade-in`;
  toast.innerHTML = `
            <i class="${ICONS[type] || ICONS.info}"></i>
            <span></span>
        `;
  toast.querySelector("span").textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
