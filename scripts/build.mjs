import { readFileSync, writeFileSync } from "node:fs";
import { iconMarkup } from "../js/icon-paths.js";

const profile = JSON.parse(readFileSync(new URL("../data/profile.json", import.meta.url), "utf8"));
const postsFile = JSON.parse(readFileSync(new URL("../blog/posts.json", import.meta.url), "utf8"));
const indexPath = new URL("../index.html", import.meta.url);
let html = readFileSync(indexPath, "utf8");

const person = profile.person;
const description = person.description;
const title = person.pageTitle;

html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
for (const name of ["description"]) {
  html = replaceMeta(html, "name", name, description);
}
html = replaceMeta(html, "property", "og:description", description);
html = replaceMeta(html, "name", "twitter:description", description);
html = replaceMeta(html, "property", "og:title", title);
html = replaceMeta(html, "name", "twitter:title", title);

html = fill(html, "about", profile.about.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n"));
html = fill(html, "interests", (profile.about.interests || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("\n"));
html = fill(html, "skills", profile.skills.map((group) => `<div><dt>${escapeHtml(group.group)}</dt><dd>${escapeHtml(group.items.join(", "))}</dd></div>`).join("\n"));
html = fill(html, "publications", publicationsHtml(profile));
html = fill(html, "experience", profile.experience.map(jobHtml).join("\n"));
html = fill(html, "projects", profile.projects.filter((item) => item.available && item.summary).map(projectHtml).join("\n"));
html = fill(html, "education", profile.education.map(eduHtml).join("\n"));
html = fill(html, "certs-pro", certItems(profile.certifications, "professional"));
html = fill(html, "certs-online", certItems(profile.certifications, "online"));
const headlines = latestPosts(postsFile.posts || []);
html = html.replace(
  /<aside class="news-line"(?: hidden)?/,
  headlines.length ? '<aside class="news-line"' : '<aside class="news-line" hidden'
);
html = fill(html, "news", tickerItems(headlines, false));
html = fill(html, "contact-copy", (profile.collaborate.paragraphs || []).map((p) => `<p>${escapeHtml(p)}</p>`).join("\n"));
html = fill(html, "contact", contactHtml(profile.contact));
html = fill(html, "hero-social", heroSocialHtml(profile.contact));

const ld = jsonLd(profile);
html = html.replace(
  /<script type="application\/ld\+json" id="person-ld">[\s\S]*?<\/script>/,
  `<script type="application/ld+json" id="person-ld">${ld}</script>`
);

writeFileSync(indexPath, html);
console.log("wrote index.html");

function fill(source, name, inner) {
  const re = new RegExp(`<!-- build:${name} -->[\\s\\S]*?<!-- /build:${name} -->`);
  if (!re.test(source)) throw new Error(`missing marker ${name}`);
  return source.replace(re, `<!-- build:${name} -->\n${inner}\n<!-- /build:${name} -->`);
}

function replaceMeta(source, attr, key, content) {
  const re = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[\\s\\S]*?(")`);
  if (!re.test(source)) throw new Error(`missing meta ${key}`);
  return source.replace(re, `$1${escapeAttr(content)}$2`);
}

function publicationsHtml(data) {
  const groups = [
    ["Journal", data.publications.filter((paper) => paper.type === "journal")],
    ["Conference", data.publications.filter((paper) => paper.type === "conference")]
  ].filter(([, items]) => items.length);
  return groups.map(([label, items]) => {
    const heading = groups.length > 1 ? `<h3 class="subhead">${escapeHtml(label)}</h3>` : "";
    const list = items.map((paper) => paperHtml(paper, data.person.name)).join("");
    return `<div class="paper-group">${heading}<ol class="papers">${list}</ol></div>`;
  }).join("\n");
}

function paperHtml(paper, selfName) {
  const title = paper.url
    ? `<a href="${escapeAttr(paper.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(paper.title)}</a>`
    : `<span>${escapeHtml(paper.title)}</span>`;
  const authors = (paper.authors || []).map((name) => {
    return name.trim() === selfName.trim() ? `<strong class="self">${escapeHtml(name)}</strong>` : escapeHtml(name);
  }).join(", ");
  const meta = [paper.venue, paper.date || paper.year].filter(Boolean).join(" · ");
  return `<li>${title}<p class="authors">${authors}</p><span class="venue">${venueMarkup(meta)}</span></li>`;
}

function jobHtml(job) {
  const duties = (job.duties || []).map((duty) => `<li>${escapeHtml(duty)}</li>`).join("");
  const org = [job.org, job.location].filter(Boolean).join(" · ");
  return `<article class="job"><p class="job-dates">${escapeHtml(job.dates)}</p><div class="job-body"><span class="job-mark" aria-hidden="true"></span><h3>${escapeHtml(job.role)}</h3><p class="job-org">${escapeHtml(org)}</p><ul class="duties">${duties}</ul></div></article>`;
}

function projectHtml(project) {
  const name = prettyName(project.name);
  const srcset = project.imageSrcset ? ` srcset="${escapeAttr(project.imageSrcset)}" sizes="(max-width: 860px) 100vw, 520px"` : "";
  const media = project.image
    ? `<div class="project-media"><img src="${escapeAttr(project.image)}"${srcset} alt="${escapeAttr(project.imageAlt || name)}" width="${project.imageWidth || 1200}" height="${project.imageHeight || 750}" loading="lazy" decoding="async"></div>`
    : "";
  const links = [
    project.demo ? `<a class="button button-primary" href="${escapeAttr(project.demo)}" target="_blank" rel="noopener noreferrer">Live demo</a>` : "",
    project.url ? `<a class="button button-ghost" href="${escapeAttr(project.url)}" target="_blank" rel="noopener noreferrer">Code</a>` : ""
  ].filter(Boolean).join("");
  const lang = project.language ? `<span class="pill">${escapeHtml(project.language)}</span>` : "";
  const tilted = media.replace('class="project-media"', 'class="project-media" data-sc-tilt="5"');
  return `<article class="project-card">${tilted}<div class="project-body"><div class="project-top">${lang}</div><h3>${escapeHtml(name)}</h3><p>${escapeHtml(project.summary)}</p><div class="project-links">${links}</div></div></article>`;
}

function eduHtml(item) {
  const bits = [
    item.gpa ? `CGPA ${item.gpa}` : "",
    item.standing || "",
    item.advisor ? `Advisor: ${item.advisor}` : "",
    item.thesis ? `Thesis: ${item.thesis}` : ""
  ].filter(Boolean);
  const extra = bits.length ? `<ul class="duties">${bits.map((bit) => `<li>${escapeHtml(bit)}</li>`).join("")}</ul>` : "";
  const place = [item.school, item.location].filter(Boolean).join(" · ");
  return `<article class="job"><p class="job-dates">${escapeHtml(item.dates || "")}</p><div class="job-body"><span class="job-mark" aria-hidden="true"></span><h3>${escapeHtml(item.degree)}</h3><p class="job-org">${escapeHtml(place)}</p>${extra}</div></article>`;
}

function certItems(items, kind) {
  return (items || []).filter((item) => item.kind === kind).map(certItem).join("\n");
}

function certItem(item) {
  const date = item.date ? `<span class="cert-date">${escapeHtml(item.date)}</span>` : "";
  return `<li><span class="cert-line">${escapeHtml(certLabel(item))}</span>${date}</li>`;
}

function certLabel(item) {
  const issuer = String(item.issuer || "").trim();
  const place = String(item.place || "").trim();
  let tail = "";
  if (issuer && place) tail = `${issuer} (${place})`;
  else if (issuer) tail = issuer;
  else if (place) tail = `(${place})`;
  return tail ? `${item.title}, ${tail}` : item.title;
}

function latestPosts(posts) {
  return posts
    .filter((post) => post && post.slug && post.title)
    .sort((a, b) => String(b.published || b.date || "").localeCompare(String(a.published || a.date || "")))
    .slice(0, 5);
}

function tickerItems(posts) {
  if (!posts.length) return "";
  return posts.map((post) => newsItem(post, false)).join("\n");
}

function newsItem(post, hidden) {
  const tab = hidden ? ` tabindex="-1"` : "";
  const hide = hidden ? ` aria-hidden="true"` : "";
  const href = `blog/post.html?slug=${encodeURIComponent(post.slug)}`;
  return `<li${hide}><a href="${href}"${tab}>${escapeHtml(post.title)}</a></li>`;
}

function venueMarkup(text) {
  return escapeHtml(text).replace(
    /\b(DMD\d{4}-\d+|V\d+T\d+A\d+|10\.\d{4,}\/[^\s<]+)/g,
    '<span class="paper-id">$1</span>'
  );
}

function contactHtml(contact) {
  const rows = [
    ["email", "Email", contact.email, `mailto:${contact.email}`],
    ["whatsapp", "WhatsApp", contact.whatsappLabel, contact.whatsapp],
    ["linkedin", "LinkedIn", contact.linkedinLabel, contact.linkedin],
    ["github", "GitHub", contact.githubLabel, contact.github],
    ["x", "X", contact.xLabel, contact.x],
    ["scholar", "Google Scholar", contact.scholarLabel, contact.scholar],
    ["cv", "Download CV", "PDF", contact.cv]
  ];
  return rows.filter(([, , , href]) => href).map(([icon, label, value, href]) => {
    const external = /^https?:/i.test(href) ? ` target="_blank" rel="noopener noreferrer"` : "";
    const download = href.startsWith("assets/") ? " download" : "";
    return `<li><a href="${escapeAttr(href)}"${external}${download}>${iconMarkup(icon)}<span class="contact-label">${escapeHtml(label)}</span><span class="contact-value">${escapeHtml(value)}</span></a></li>`;
  }).join("\n");
}

function heroSocialHtml(contact) {
  const rows = [
    ["linkedin", "LinkedIn", contact.linkedin],
    ["scholar", "Google Scholar", contact.scholar],
    ["github", "GitHub", contact.github],
    ["x", `X (${contact.xLabel || "@nzml087"})`, contact.x]
  ];
  return rows.filter(([, , href]) => href).map(([icon, label, href]) => {
    return `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer" title="${escapeAttr(label)}" aria-label="${escapeAttr(label)}">${iconMarkup(icon)}</a>`;
  }).join("\n");
}

function jsonLd(data) {
  const alumniOf = (data.education || [])
    .filter((item) => /brac|cuet/i.test(item.school || ""))
    .map((item) => ({
      "@type": "CollegeOrUniversity",
      name: String(item.school).replace(/\s*\([^)]*\)\s*$/, "")
    }));
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    jobTitle: person.title,
    description,
    affiliation: { "@type": "Organization", name: person.affiliation },
    alumniOf,
    knowsAbout: data.research.map((item) => item.title),
    address: { "@type": "Place", name: person.location },
    email: `mailto:${data.contact.email}`,
    url: "https://nazmulislam-lab.github.io/",
    image: `https://nazmulislam-lab.github.io/${person.portrait}`,
    sameAs: [data.contact.github, data.contact.linkedin, data.contact.x, data.contact.scholar]
  });
}

function prettyName(name) {
  return String(name || "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}
