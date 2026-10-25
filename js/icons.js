import { iconMarkup } from "./icon-paths.js";

export function iconSvg(name) {
  const markup = iconMarkup(name);
  if (!markup) return null;
  const template = document.createElement("template");
  template.innerHTML = markup;
  return template.content.firstElementChild;
}

export function paintIcons(root = document) {
  const scope = root && root.querySelectorAll ? root : document;
  for (const el of scope.querySelectorAll("[data-icon]")) {
    if (el.querySelector(".icon")) continue;
    const svg = iconSvg(el.getAttribute("data-icon"));
    if (!svg) continue;
    const label = el.textContent.replace(/\s+/g, " ").trim();
    el.replaceChildren(svg);
    if (label) {
      const span = document.createElement("span");
      span.textContent = label;
      el.append(span);
    }
  }
}

export function renderFooterSocial(container, profile, options = {}) {
  if (!container || !profile) return;
  const rssHref = options.rssHref || "feed.xml";
  const assetPrefix = options.assetPrefix || "";
  const c = profile.contact || {};
  const handle = visitorLabel(c.xLabel) || "@nzml087";
  const items = [
    { href: c.github, icon: "github", label: "GitHub" },
    { href: c.linkedin, icon: "linkedin", label: "LinkedIn" },
    { href: c.x, icon: "x", label: `X (${handle})` },
    { href: c.whatsapp, icon: "whatsapp", label: "WhatsApp" },
    { href: c.scholar, icon: "scholar", label: "Google Scholar" },
    { href: c.email ? `mailto:${c.email}` : "", icon: "email", label: "Email" },
    { href: rssHref, icon: "rss", label: "RSS feed" }
  ];
  container.replaceChildren();
  container.classList.add("footer-social");
  if (!container.getAttribute("aria-label")) container.setAttribute("aria-label", "Social profiles");
  for (const item of items) {
    if (isBlank(item.href)) continue;
    let href = String(item.href);
    if (item.asset && assetPrefix && !/^https?:/i.test(href)) {
      href = assetPrefix + href.replace(/^\//, "");
    }
    const link = document.createElement("a");
    link.href = href;
    link.setAttribute("aria-label", item.label);
    link.title = item.label;
    if (/^https?:/i.test(href)) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    if (item.download && !/^https?:/i.test(href)) link.setAttribute("download", "");
    const svg = iconSvg(item.icon);
    if (svg) link.append(svg);
    container.append(link);
  }
}

function visitorLabel(value) {
  const text = String(value || "").trim();
  if (!text || /\bTODO\b/i.test(text)) return "";
  return text;
}

function isBlank(value) {
  const text = String(value || "").trim();
  return !text || /\bTODO\b/i.test(text);
}
