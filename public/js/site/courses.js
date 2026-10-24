// Public courses grid + details modal.
// Uses event delegation (data-course-id) instead of inline onclick,
// and addEventListener instead of overwriting window.onclick.
import { fetchWithFallback, escapeHtml } from "./api.js";

const courseContent = {};

function outlineItem(item) {
  return `
              <li class="flex items-center text-gray-900 dark:text-white">
                <span>
                  <svg class="w-6 h-6 mr-3 text-green-500" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z">
                    </path>
                  </svg>
                </span>
                <span>${escapeHtml(item)}</span>
              </li>
            `;
}

function courseCard(course) {
  return `
          <div class="bg-white dark:bg-gray-700 rounded-xl shadow-lg overflow-hidden group">
            <div class="relative">
              <img
                loading="lazy"
                src="${escapeHtml(course.image)}"
                alt="${escapeHtml(course.alt)}"
                class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div class="absolute top-4 right-4">
                <span class="bg-primary text-white px-3 py-1 rounded-full text-sm">
                  ${escapeHtml(course.level)}
                </span>
              </div>
            </div>
            <div class="p-6">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                ${escapeHtml(course.title)}
              </h3>
              <div class="flex items-center justify-start md:justify-end gap-3">
                <a href="#contact">
                  <button
                    class="cursor-pointer px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition duration-300 transform hover:-translate-y-1"
                  >
                    Enroll Now
                  </button>
                </a>
                <button
                  data-course-id="${escapeHtml(course.id)}"
                  class="course-details-btn cursor-pointer px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition duration-300 transform hover:-translate-y-1"
                >
                  See Details
                </button>
              </div>
            </div>
          </div>
        `;
}

export function showModal(courseId) {
  const modal = document.getElementById("modal");
  const modalContent = document.getElementById("modalContent");
  if (!modal || !modalContent) return;
  modalContent.innerHTML = courseContent[courseId] || "<p>Course not found.</p>";
  modal.classList.remove("hidden");
  setTimeout(() => {
    modal.classList.remove("opacity-0", "scale-95");
    modal.classList.add("opacity-100", "scale-100");
  }, 10);
}

export function closeModal() {
  const modal = document.getElementById("modal");
  if (!modal) return;
  modal.classList.remove("opacity-100", "scale-100");
  modal.classList.add("opacity-0", "scale-95");
  setTimeout(() => modal.classList.add("hidden"), 300);
}

export async function loadCourses() {
  try {
    const courses = await fetchWithFallback("/api/admin/courses", "/data/courses.json");
    const container = document.getElementById("courses-container");
    const noCourse = document.getElementById("no-course-container");
    if (!container) return;

    if (!Array.isArray(courses) || courses.length === 0) {
      if (noCourse) {
        noCourse.innerHTML =
          '<p class="text-center text-gray-500 dark:text-gray-400 py-8 w-full">No courses available yet.</p>';
      }
      return;
    }

    container.innerHTML = courses.map((course) => {
      const outlineHTML = (course.outlines || []).map(outlineItem).join("");
      courseContent[course.id] = `
          <h2 class="text-3xl font-bold mb-6 dark:text-white text-dark bg:text-slate-900">${escapeHtml(course.title)}</h2>
          <h3 class="text-2xl font-semibold mb-4 text-dark dark:text-white bg:text-slate-900">📖 Course Outline</h3>
          <ul class="space-y-3 text-gray-700">
            ${outlineHTML}
          </ul>
        `;
      return courseCard(course);
    }).join("");

    container.querySelectorAll(".course-details-btn").forEach((btn) => {
      btn.addEventListener("click", () => showModal(btn.dataset.courseId));
    });
  } catch (error) {
    console.error("Error loading courses:", error);
  }
}

export function initCourseModal() {
  window.showModal = showModal; // kept for any legacy inline handlers
  window.closeModal = closeModal;
  document.querySelector("[data-close-modal]")?.addEventListener("click", closeModal);
  document.getElementById("modal")?.addEventListener("click", (event) => {
    if (event.target.id === "modal") closeModal();
  });
}
