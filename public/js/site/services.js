// Public services grid. Same alternating image/content layout,
// with quoted + escaped attributes (old code had unquoted src=${...}).
import { fetchWithFallback, escapeHtml } from "./api.js";

function imageBlock(service) {
  return `<div class="grid grid-cols-12 gap-4">
              <div class="col-span-7">
                <img
                loading="lazy"
                  src="${escapeHtml(service.images.image1)}"
                  alt="image1"
                  class="w-full h-80 object-cover rounded-lg shadow-lg"
                />
              </div>
              <div class="col-span-5 space-y-4">
                <img
                loading="lazy"
                  src="${escapeHtml(service.images.image2)}"
                  alt="image2"
                  class="w-full h-[152px] object-cover rounded-lg shadow-lg"
                />
                <img
                loading="lazy"
                  src="${escapeHtml(service.images.image3)}"
                  alt="image3"
                  class="w-full h-[152px] object-cover rounded-lg shadow-lg"
                />
              </div>
            </div>`;
}

function contentBlock(service) {
  const outlines = service.outlines
    ? `<ul class="space-y-3 text-gray-600 dark:text-gray-300">
              ${Object.values(service.outlines)
                .map(
                  (outline) => `
                  <li class="flex items-center gap-3">
                    <svg
                      class="w-5 h-5 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    ${escapeHtml(outline)}
                  </li>`
                )
                .join("")}
            </ul>`
    : "";
  return `
    <div class="space-y-6">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center">
          <svg
            class="w-8 h-8 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
          ${escapeHtml(service.title)}
        </h3>
      </div>
      <p class="text-gray-600 dark:text-gray-300">
        ${escapeHtml(service.description)}
      </p>
      ${outlines}
      <a
        href="#contact"
        class="inline-flex items-center gap-2 text-primary hover:text-blue-700"
      >
        Learn More
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </a>
    </div>
  `;
}

export async function loadServices() {
  try {
    const services = await fetchWithFallback("/api/admin/services", "/data/services.json");
    const serviceContainer = document.getElementById("service-container");
    if (!serviceContainer) return;
    if (!Array.isArray(services) || services.length === 0) {
      serviceContainer.innerHTML =
        '<p class="text-center text-gray-500 dark:text-gray-400 py-8">No services available yet.</p>';
      return;
    }
    serviceContainer.innerHTML = "";
    services.forEach((service, i) => {
      const serviceCard = document.createElement("div");
      serviceCard.className = "mb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center";
      serviceCard.innerHTML =
        i % 2 === 0
          ? imageBlock(service) + contentBlock(service)
          : contentBlock(service) + imageBlock(service);
      serviceContainer.appendChild(serviceCard);
    });
  } catch (error) {
    console.error("Error fetching services:", error);
  }
}
