// Public site entrypoint. Replaces the 8 inline <script> blocks at the
// bottom of index.html (theme init stays inline in <head> to avoid FOUC).
import { initTheme, bindThemeToggles } from "./theme.js";
import { trackVisit } from "./analytics.js";
import { loadContactInfo } from "./contact.js";
import { initNavigation } from "./navigation.js";
import { initCarousel } from "./carousel.js";
import { loadServices } from "./services.js";
import { loadCourses, initCourseModal } from "./courses.js";
import { initLazyReveal } from "./lazy.js";

document.getElementById("year").textContent = new Date().getFullYear();

initTheme();
bindThemeToggles();
trackVisit();
loadContactInfo();
loadServices();
loadCourses();
initCourseModal();

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initCarousel();
  initLazyReveal();
});
