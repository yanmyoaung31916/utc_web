// Hero carousel. Same behavior (5s auto-advance, prev/next buttons),
// plus pause-on-hover so text stays readable.
export function initCarousel() {
  const slideContainer = document.getElementById("slide-container");
  const prevButton = document.getElementById("prev-button");
  const nextButton = document.getElementById("next-button");
  const carousel = document.getElementById("carousel");
  if (!slideContainer || !prevButton || !nextButton) return;

  const slides = slideContainer.children;
  let currentSlide = 0;

  function showSlide(index) {
    slideContainer.style.transform = `translateX(-${index * 100}%)`;
  }
  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  }
  function prevSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(currentSlide);
  }

  nextButton.addEventListener("click", nextSlide);
  prevButton.addEventListener("click", prevSlide);

  let timer = setInterval(nextSlide, 5000);
  carousel?.addEventListener("mouseenter", () => clearInterval(timer));
  carousel?.addEventListener("mouseleave", () => {
    clearInterval(timer);
    timer = setInterval(nextSlide, 5000);
  });
}
