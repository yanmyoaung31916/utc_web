// Public contact block. Same API-first, /data fallback as before.
import { fetchWithFallback } from "./api.js";

export async function loadContactInfo() {
  try {
    const contact = await fetchWithFallback("/api/admin/contact", "/data/contact.json");

    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };
    setText("contact-address", contact.address);
    setText("contact-email", contact.email);
    setText(
      "contact-phone",
      contact.phone ? Object.values(contact.phone).join(", ") : ""
    );

    const setHref = (id, value) => {
      if (value) {
        const el = document.getElementById(id);
        if (el) el.href = value;
      }
    };
    setHref("facebook-link", contact.social?.facebook);
    setHref("youtube-link", contact.social?.youtube);
    setHref("tiktok-link", contact.social?.tiktok);
    setHref("viber-link", contact.social?.viber);
  } catch (error) {
    console.error("Error loading contact info:", error);
  }
}
