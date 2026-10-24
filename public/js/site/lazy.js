// Reveal-on-scroll for sections marked data-lazy.
export function initLazyReveal() {
  const lazySections = document.querySelectorAll("section[data-lazy]");
  if (!("IntersectionObserver" in window)) {
    lazySections.forEach((section) => section.classList.add("lazy-loaded"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("lazy-loaded");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  lazySections.forEach((section) => observer.observe(section));
}
