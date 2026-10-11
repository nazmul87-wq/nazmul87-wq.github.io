import { iconSvg } from "./icons.js";

const THEME_KEY = "nazmul-theme";

export function initChrome() {
  const button = document.querySelector("[data-theme-toggle]");
  if (button && !button.querySelector("svg")) {
    button.replaceChildren();
    for (const name of ["sun", "moon"]) {
      const icon = iconSvg(name);
      if (!icon) continue;
      icon.classList.add("theme-icon", name === "sun" ? "theme-icon-sun" : "theme-icon-moon");
      button.append(icon);
    }
  }
  if (button) {
    const sync = () => {
      const dark = document.documentElement.dataset.theme === "dark";
      button.setAttribute("aria-pressed", dark ? "true" : "false");
      button.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    };
    sync();
    button.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", next === "dark" ? "#101114" : "#f6f3ec");
      sync();
    });
  }

  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (!toggle || !nav) return;
  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("nav-open", open);
  };
  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });
}
