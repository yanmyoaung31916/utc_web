// Generic modal helpers replacing the 3x show/hide modal pairs.
export function showModalById(id) {
  document.getElementById(id)?.classList.remove("hidden");
}

export function hideModalById(id) {
  document.getElementById(id)?.classList.add("hidden");
}

export function bindModalOutsideClick(id) {
  document.getElementById(id)?.addEventListener("click", (e) => {
    if (e.target.id === id) hideModalById(id);
  });
}
