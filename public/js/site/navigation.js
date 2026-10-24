// Mobile menu + scrollspy. Fixes the old scrollspy selector
// (".hidden.md:flex a" never matched the desktop ".responsive-flex" links)
// by observing all in-nav anchor links instead.
export function initNavigation() {
  const mobileMenu = document.getElementById("mobile-menu");
  const menuButton = document.getElementById("mobile-menu-button");
  if (!mobileMenu) return;

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => mobileMenu.classList.add("hidden"));
  });

  menuButton?.addEventListener("click", () => mobileMenu.classList.toggle("hidden"));

  document.addEventListener("click", (e) => {
    if (
      !mobileMenu.contains(e.target) &&
      !menuButton?.contains(e.target) &&
      !mobileMenu.classList.contains("hidden")
    ) {
      mobileMenu.classList.add("hidden");
    }
  });

  const navLinks = document.querySelectorAll('nav a[href^="#"]');
  if (!navLinks.length) return;
  window.addEventListener("scroll", () => {
    let current = "";
    document.querySelectorAll("section[id]").forEach((section) => {
      if (window.scrollY >= section.offsetTop - 60) current = section.getAttribute("id");
    });
    navLinks.forEach((link) => {
      link.classList.remove("active", "font-bold");
      if (link.getAttribute("href") === `#${current}`) link.classList.add("active", "font-bold");
    });
  });
}
