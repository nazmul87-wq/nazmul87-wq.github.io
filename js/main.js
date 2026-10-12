import { initChat } from "./chat.js";
import { initChrome } from "./chrome.js";
import { iconSvg, paintIcons, renderFooterSocial } from "./icons.js";

initChrome();

const status = document.querySelector("[data-status]");

loadTicker();

loadProfile()
  .then((profile) => {
    renderProfile(profile);
    initChat(profile);
    if (status) status.hidden = true;
  })
  .catch(() => {
    if (status) {
      status.hidden = false;
      status.textContent = "This page could not load data/profile.json. From the site folder, run a local server such as: python3 -m http.server";
    }
  });

function loadTicker() {
  fetch("blog/posts.json", { cache: "no-cache" })
    .then((response) => {
      if (!response.ok) throw new Error("posts");
      return response.json();
    })
    .then((data) => renderTicker(latestPosts(data.posts || [])))
    .catch(() => {});
}

function latestPosts(posts) {
  return posts
    .filter((post) => post && post.slug && post.title)
    .sort((a, b) => String(b.published || b.date || "").localeCompare(String(a.published || a.date || "")))
    .slice(0, 5);
}

function renderTicker(items) {
  const ticker = document.querySelector("[data-news]");
  if (!ticker) return;
  const viewport = ticker.querySelector(".news-viewport");
  const lists = [...ticker.querySelectorAll(".news-list")];
  const primary = lists[0];
  if (!viewport || !primary || !items.length) {
    ticker.hidden = true;
    return;
  }
  ticker.hidden = false;
  primary.replaceChildren();
  const appendSet = (hidden) => {
    for (const item of items) primary.append(newsLink(item, hidden));
  };
  appendSet(false);
  let guard = 0;
  while (primary.scrollWidth < viewport.clientWidth && guard < 12) {
    appendSet(true);
    guard += 1;
  }
  for (const list of lists.slice(1)) {
    list.replaceChildren();
    list.setAttribute("aria-hidden", "true");
    for (const node of primary.children) {
      const clone = node.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      const link = clone.querySelector("a");
      if (link) link.tabIndex = -1;
      list.append(clone);
    }
  }
}

function newsLink(item, hidden) {
  const li = document.createElement("li");
  const link = document.createElement("a");
  link.href = `blog/post.html?slug=${encodeURIComponent(item.slug)}`;
  link.textContent = item.title;
  if (hidden) {
    li.setAttribute("aria-hidden", "true");
    link.tabIndex = -1;
  }
  li.append(link);
  return li;
}

async function loadProfile() {
  const response = await fetch("data/profile.json", { cache: "no-cache" });
  if (!response.ok) throw new Error("profile");
  return response.json();
}

function renderProfile(profile) {
  const person = profile.person;
  const pageTitle = person.pageTitle || `${person.name} · Portfolio`;
  document.title = pageTitle;
  const description = person.description || "";
  for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
    const node = document.querySelector(selector);
    if (node && description) node.setAttribute("content", description);
  }
  for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) {
    const node = document.querySelector(selector);
    if (node) node.setAttribute("content", pageTitle);
  }

  setText("[data-name]", person.name);
  setText("[data-given]", person.givenName);
  setText("[data-tagline]", person.tagline || "");
  setText("[data-value]", person.valueStatement || "");
  setText("[data-year]", String(new Date().getFullYear()));
  const eyebrow = document.querySelector("[data-eyebrow]");
  if (eyebrow) {
    const quantum = (profile.research || []).some((item) => /quantum sensors/i.test(item.title));
    eyebrow.textContent = [person.title, person.affiliation, quantum ? "Quantum sensors" : "", person.location].filter(Boolean).join(" · ");
  }

  const emailLink = document.querySelector("[data-email-link]");
  if (emailLink && !isPlaceholder(profile.contact.email)) emailLink.href = `mailto:${profile.contact.email}`;
  const githubLink = document.querySelector("[data-github-link]");
  if (githubLink && !isPlaceholder(profile.contact.github)) githubLink.href = profile.contact.github;
  const linkedinLink = document.querySelector("[data-linkedin-link]");
  if (linkedinLink && !isPlaceholder(profile.contact.linkedin)) linkedinLink.href = profile.contact.linkedin;
  const xLink = document.querySelector("[data-x-link]");
  if (xLink) {
    if (isPlaceholder(profile.contact.x)) xLink.hidden = true;
    else xLink.href = profile.contact.x;
  }
  const whatsappLink = document.querySelector("[data-whatsapp-link]");
  if (whatsappLink) {
    if (isPlaceholder(profile.contact.whatsapp)) whatsappLink.hidden = true;
    else whatsappLink.href = profile.contact.whatsapp;
  }
  const scholarLink = document.querySelector("[data-scholar-link]");
  if (scholarLink) {
    if (isPlaceholder(profile.contact.scholar)) scholarLink.hidden = true;
    else scholarLink.href = profile.contact.scholar;
  }
  wireCvLink(profile.contact.cv);
  renderHeroSocial(profile);

  const portrait = document.querySelector("[data-portrait]");
  if (portrait) {
    portrait.src = person.portrait;
    portrait.alt = person.portraitAlt || person.name;
  }
  const about = document.querySelector("[data-about]");
  if (about) {
    about.replaceChildren();
    for (const paragraph of profile.about.paragraphs) {
      const p = document.createElement("p");
      p.textContent = paragraph;
      about.append(p);
    }
  }

  renderSkills(profile.skills);
  renderInterests(profile.about && profile.about.interests);
  renderEducation(profile.education);
  renderPublications(profile);
  renderExperience(profile.experience);
  renderCertifications(profile.certifications);
  renderProjects(profile.projects);
  renderBeyond(profile.beyond);
  renderCollaborate(profile);
  renderContact(profile);
  renderStructuredData(profile);
  renderFooterSocial(document.querySelector("[data-footer-social]"), profile, { rssHref: "feed.xml" });
  paintIcons(document);
  initReveal();
}

function renderSkills(groups) {
  const root = document.querySelector("[data-skills]");
  if (!root) return;
  root.replaceChildren();
  for (const group of groups || []) {
    const wrap = document.createElement("div");
    const name = document.createElement("dt");
    name.textContent = group.group;
    const values = document.createElement("dd");
    values.textContent = group.items.join(", ");
    wrap.append(name, values);
    root.append(wrap);
  }
}

function renderInterests(items) {
  const root = document.querySelector("[data-interests]");
  if (!root) return;
  root.replaceChildren();
  for (const item of items || []) {
    if (isPlaceholder(item)) continue;
    const li = document.createElement("li");
    li.textContent = item;
    root.append(li);
  }
}

function renderEducation(items) {
  const root = document.querySelector("[data-education]");
  if (!root) return;
  root.replaceChildren();
  const rows = (items || []).filter((item) => !isPlaceholder(item.degree) || !isPlaceholder(item.school));
  for (const item of rows) {
    const card = document.createElement("article");
    card.className = "job";
    if (!isPlaceholder(item.dates)) {
      const dates = document.createElement("p");
      dates.className = "job-dates";
      dates.textContent = item.dates;
      card.append(dates);
    }
    const body = document.createElement("div");
    body.className = "job-body";
    const mark = document.createElement("span");
    mark.className = "job-mark";
    mark.setAttribute("aria-hidden", "true");
    const degree = document.createElement("h3");
    degree.textContent = item.degree;
    const school = document.createElement("p");
    school.className = "job-org";
    school.textContent = [item.school, item.location].filter((part) => !isPlaceholder(part)).join(" · ");
    body.append(mark, degree, school);
    const facts = [
      !isPlaceholder(item.gpa) ? `CGPA ${item.gpa}` : "",
      !isPlaceholder(item.standing) ? item.standing : "",
      !isPlaceholder(item.advisor) ? `Advisor: ${item.advisor}` : "",
      !isPlaceholder(item.thesis) ? `Thesis: ${item.thesis}` : ""
    ].filter(Boolean);
    if (facts.length) {
      const list = document.createElement("ul");
      list.className = "duties";
      for (const fact of facts) {
        const li = document.createElement("li");
        li.textContent = fact;
        list.append(li);
      }
      body.append(list);
    }
    card.append(body);
    root.append(card);
  }
}

function renderCertifications(items) {
  const professional = document.querySelector("[data-certs-professional]");
  const online = document.querySelector("[data-certs-online]");
  const more = document.querySelector("[data-certs-more]");
  const certs = sortCerts(items || []);
  const pro = certs.filter((item) => item.kind === "professional");
  const web = certs.filter((item) => item.kind !== "professional");
  fillCertList(professional, pro);
  fillCertList(online, web);
  if (more) more.hidden = web.length === 0;
}

function fillCertList(root, items) {
  if (!root) return;
  root.replaceChildren();
  for (const item of items) root.append(certItem(item));
}

function certItem(item) {
  const li = document.createElement("li");
  const line = document.createElement("span");
  line.className = "cert-line";
  line.textContent = certLabel(item);
  li.append(line);
  if (!isPlaceholder(item.date)) {
    const date = document.createElement("span");
    date.className = "cert-date";
    date.textContent = item.date;
    li.append(date);
  }
  return li;
}

function certLabel(item) {
  const issuer = isPlaceholder(item.issuer) ? "" : String(item.issuer).trim();
  const place = isPlaceholder(item.place) ? "" : String(item.place).trim();
  let tail = "";
  if (issuer && place) tail = `${issuer} (${place})`;
  else if (issuer) tail = issuer;
  else if (place) tail = `(${place})`;
  return tail ? `${item.title}, ${tail}` : item.title;
}

const CERT_MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

function certStamp(item) {
  const date = String(item.date || "");
  const year = date.match(/\b(19|20)\d{2}\b/);
  if (!year) return 0;
  const month = date.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
  const dayMatch = date.match(/\b(\d{1,2})\b/);
  const day = dayMatch && Number(dayMatch[1]) <= 31 ? Number(dayMatch[1]) : 1;
  return Number(year[0]) * 10000 + (month ? CERT_MONTHS[month[1].toLowerCase()] : 1) * 100 + day;
}

function sortCerts(items) {
  return items
    .filter((item) => item && !isPlaceholder(item.title))
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const kind = (a.item.kind === "professional" ? 0 : 1) - (b.item.kind === "professional" ? 0 : 1);
      if (kind) return kind;
      const stamp = certStamp(b.item) - certStamp(a.item);
      if (stamp) return stamp;
      return a.index - b.index;
    })
    .map((entry) => entry.item);
}

function renderKeywords(keywords) {
  const root = document.querySelector("[data-keywords]");
  if (!root) return;
  root.replaceChildren();
  for (const word of keywords.filter((item) => !isPlaceholder(item))) {
    const li = document.createElement("li");
    li.textContent = word;
    root.append(li);
  }
  root.hidden = root.childElementCount === 0;
}

function renderPrevious(jobs) {
  const node = document.querySelector("[data-previous]");
  if (!node) return;
  const names = jobs.filter((job) => !job.current && !isPlaceholder(job.org)).map((job) => job.org);
  node.textContent = names.length ? `I previously worked at ${joinNames(names)}.` : "";
  node.hidden = !node.textContent;
}

function joinNames(names) {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function renderPublications(profile) {
  const section = document.querySelector("[data-publications-section]");
  const papers = (profile.publications || []).filter((item) => !isPlaceholder(item.title));
  const talks = (profile.talks || []).filter((item) => !isPlaceholder(item.title));
  const paperList = document.querySelector("[data-publications]");
  const talkList = document.querySelector("[data-talks]");
  const talkBlock = document.querySelector("[data-talks-block]");
  const paperBlock = document.querySelector("[data-papers-block]");
  const nav = document.querySelector("[data-nav-publications]");
  if (paperList) {
    paperList.replaceChildren();
    const groups = [
      ["Journal", papers.filter((paper) => paper.type === "journal")],
      ["Conference", papers.filter((paper) => paper.type === "conference")],
      ["Other", papers.filter((paper) => paper.type !== "journal" && paper.type !== "conference")]
    ].filter(([, items]) => items.length);
    const named = profile.person && profile.person.name;
    for (const [label, items] of groups) {
      const block = document.createElement("div");
      block.className = "paper-group";
      if (groups.length > 1) {
        const heading = document.createElement("h3");
        heading.className = "subhead";
        heading.textContent = label;
        block.append(heading);
      }
      const list = document.createElement("ol");
      list.className = "papers";
      for (const paper of items) list.append(entryItem(paper, named));
      block.append(list);
      paperList.append(block);
    }
  }
  if (talkList) {
    talkList.replaceChildren();
    for (const talk of talks) talkList.append(entryItem(talk, profile.person && profile.person.name));
  }
  if (paperBlock) paperBlock.hidden = papers.length === 0;
  if (talkBlock) talkBlock.hidden = talks.length === 0;
  const title = document.querySelector("[data-publications-title]");
  const kicker = document.querySelector("[data-publications-kicker]");
  if (papers.length && talks.length) {
    if (kicker) kicker.textContent = "Publications and talks";
    if (title) title.textContent = "Papers and talks from my public profile.";
  } else if (talks.length) {
    if (kicker) kicker.textContent = "Talks";
    if (title) title.textContent = "Talks from my public profile.";
  }
  const visible = papers.length + talks.length > 0;
  if (section) section.hidden = !visible;
  if (nav) nav.hidden = !visible;
}

function venueMarkup(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\b(DMD\d{4}-\d+|V\d+T\d+A\d+|10\.\d{4,}\/[^\s<]+)/g, '<span class="paper-id">$1</span>');
}

function entryItem(entry, selfName) {
  const item = document.createElement("li");
  const label = entry.title;
  if (!isPlaceholder(entry.url)) {
    const title = document.createElement("a");
    title.href = entry.url;
    title.target = "_blank";
    title.rel = "noopener noreferrer";
    title.textContent = label;
    item.append(title);
  } else {
    const title = document.createElement("span");
    title.textContent = label;
    item.append(title);
  }
  const authors = (entry.authors || []).filter((name) => !isPlaceholder(name));
  if (authors.length) item.append(authorLine(authors, selfName));
  const meta = [entry.venue, entry.event, entry.date || entry.year].filter((part) => !isPlaceholder(part)).join(" · ");
  if (meta) {
    const venue = document.createElement("span");
    venue.className = "venue";
    venue.innerHTML = venueMarkup(meta);
    item.append(venue);
  }
  return item;
}

function authorLine(authors, selfName) {
  const line = document.createElement("p");
  line.className = "authors";
  authors.forEach((name, index) => {
    if (index) line.append(document.createTextNode(", "));
    if (selfName && name.trim() === selfName.trim()) {
      const mark = document.createElement("strong");
      mark.className = "self";
      mark.textContent = name;
      line.append(mark);
    } else {
      line.append(document.createTextNode(name));
    }
  });
  return line;
}

function renderExperience(jobs) {
  const root = document.querySelector("[data-experience]");
  if (!root) return;
  root.replaceChildren();
  for (const job of jobs) {
    const item = document.createElement("article");
    item.className = "job";
    if (!isPlaceholder(job.dates)) {
      const dates = document.createElement("p");
      dates.className = "job-dates";
      dates.textContent = job.dates;
      item.append(dates);
    }
    const body = document.createElement("div");
    body.className = "job-body";
    const mark = document.createElement("span");
    mark.className = "job-mark";
    mark.setAttribute("aria-hidden", "true");
    const role = document.createElement("h3");
    role.textContent = job.role;
    const org = document.createElement("p");
    org.className = "job-org";
    org.textContent = [job.org, job.location].filter((part) => !isPlaceholder(part)).join(" · ");
    body.append(mark, role, org);
    const duties = (job.duties || []).filter((duty) => !isPlaceholder(duty));
    if (duties.length) {
      const list = document.createElement("ul");
      list.className = "duties";
      for (const duty of duties) {
        const li = document.createElement("li");
        li.textContent = duty;
        list.append(li);
      }
      body.append(list);
    }
    item.append(body);
    root.append(item);
  }
}

function renderProjects(projects) {
  const grid = document.querySelector("[data-projects]");
  if (!grid) return;
  grid.replaceChildren();
  for (const project of projects.filter((item) => item.available && !isPlaceholder(item.summary))) {
    grid.append(projectCard(project));
  }
}

function projectCard(project) {
  const card = document.createElement("article");
  card.className = "project-card";
  if (!isPlaceholder(project.image)) {
    const media = document.createElement("div");
    media.className = "project-media";
    const img = document.createElement("img");
    img.src = project.image;
    if (project.imageSrcset) {
      img.srcset = project.imageSrcset;
      img.sizes = "(max-width: 860px) 100vw, 520px";
    }
    img.alt = project.imageAlt || prettyName(project.name);
    img.width = project.imageWidth || 1200;
    img.height = project.imageHeight || 750;
    img.loading = "lazy";
    img.decoding = "async";
    media.append(img);
    card.append(media);
  }
  const body = document.createElement("div");
  body.className = "project-body";
  const top = document.createElement("div");
  top.className = "project-top";
  if (!isPlaceholder(project.language)) {
    const lang = document.createElement("span");
    lang.className = "pill";
    lang.textContent = project.language;
    top.append(lang);
  }
  const title = document.createElement("h3");
  title.textContent = prettyName(project.name);
  const summary = document.createElement("p");
  summary.textContent = project.summary;
  const links = document.createElement("div");
  links.className = "project-links";
  if (!isPlaceholder(project.demo)) links.append(textLink(project.demo, "Live demo", "button button-primary"));
  if (!isPlaceholder(project.url)) links.append(textLink(project.url, "Code", "button button-ghost"));
  body.append(top, title, summary, links);
  card.append(body);
  return card;
}

function renderBeyond(beyond) {
  const section = document.querySelector("[data-beyond-section]");
  const nav = document.querySelector("[data-nav-beyond]");
  const data = beyond || {};
  const intro = String(data.intro || "").trim();
  const hometown = String(data.hometown || "").trim();
  const hobbies = (data.hobbies || []).filter((item) => !isPlaceholder(item));
  const gallery = (data.gallery || []).filter((item) => item && !isPlaceholder(item.src));
  const visible = Boolean(intro || hometown || hobbies.length || gallery.length);
  if (section) section.hidden = !visible;
  if (nav) nav.hidden = !visible;
  if (!visible) return;
  const copy = document.querySelector("[data-beyond-copy]");
  if (copy) {
    copy.replaceChildren();
    if (intro) {
      const p = document.createElement("p");
      p.textContent = intro;
      copy.append(p);
    }
    if (hometown) {
      const p = document.createElement("p");
      p.textContent = hometown;
      copy.append(p);
    }
  }
  const hobbyList = document.querySelector("[data-hobbies]");
  if (hobbyList) {
    hobbyList.replaceChildren();
    for (const hobby of hobbies) {
      const li = document.createElement("li");
      li.textContent = hobby;
      hobbyList.append(li);
    }
    hobbyList.hidden = hobbies.length === 0;
  }
  const grid = document.querySelector("[data-gallery]");
  if (grid) {
    grid.replaceChildren();
    for (const photo of gallery) {
      const figure = document.createElement("figure");
      const img = document.createElement("img");
      img.src = photo.src;
      img.alt = photo.alt || "";
      img.loading = "lazy";
      img.decoding = "async";
      figure.append(img);
      grid.append(figure);
    }
  }
}

function renderCollaborate(profile) {
  const copy = document.querySelector("[data-collab-copy]");
  const title = document.querySelector("[data-collab-title]");
  const block = profile.collaborate || {};
  if (title && !isPlaceholder(block.title)) title.textContent = block.title;
  if (copy) {
    copy.replaceChildren();
    for (const paragraph of block.paragraphs || []) {
      if (isPlaceholder(paragraph)) continue;
      const p = document.createElement("p");
      p.textContent = paragraph;
      copy.append(p);
    }
  }
}

function renderContact(profile) {
  const root = document.querySelector("[data-contact]");
  if (!root) return;
  const c = profile.contact;
  root.replaceChildren();

  if (!isPlaceholder(c.email)) root.append(contactLink("Email", c.email, `mailto:${c.email}`, "email"));
  if (!isPlaceholder(c.whatsapp)) root.append(contactLink("WhatsApp", c.whatsappLabel || c.whatsapp, c.whatsapp, "whatsapp"));
  if (!isPlaceholder(c.linkedin)) root.append(contactLink("LinkedIn", c.linkedinLabel || c.linkedin, c.linkedin, "linkedin"));
  if (!isPlaceholder(c.github)) root.append(contactLink("GitHub", c.githubLabel || c.github, c.github, "github"));
  if (!isPlaceholder(c.x)) root.append(contactLink("X", c.xLabel || c.x, c.x, "x"));
  if (!isPlaceholder(c.scholar)) root.append(contactLink("Google Scholar", c.scholarLabel || "Google Scholar profile", c.scholar, "scholar"));
  if (!isPlaceholder(c.cv)) root.append(contactLink("Download CV", "PDF", c.cv, "cv"));
}

function wireCvLink(path) {
  const link = document.querySelector("[data-cv-link]");
  if (!link) return;
  if (isPlaceholder(path)) {
    link.hidden = true;
    return;
  }
  link.hidden = false;
  link.href = path;
  if (!/^https?:/i.test(path)) link.setAttribute("download", "");
}

function renderStructuredData(profile) {
  const node = document.querySelector("#person-ld");
  if (!node) return;
  const person = profile.person;
  const sameAs = [profile.contact.github, profile.contact.linkedin, profile.contact.x, profile.contact.scholar].filter((url) => !isPlaceholder(url));
  const alumniOf = (profile.education || [])
    .filter((item) => /brac|cuet/i.test(item.school || ""))
    .map((item) => ({
      "@type": "CollegeOrUniversity",
      name: String(item.school).replace(/\s*\([^)]*\)\s*$/, "")
    }));
  node.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    jobTitle: person.title,
    description: person.description,
    affiliation: { "@type": "Organization", name: person.affiliation },
    alumniOf,
    knowsAbout: (profile.research || []).map((item) => item.title).filter((title) => !isPlaceholder(title)),
    address: { "@type": "Place", name: person.location },
    email: profile.contact.email ? `mailto:${profile.contact.email}` : undefined,
    url: "https://nazmulislam-lab.github.io/",
    image: person.portrait ? `https://nazmulislam-lab.github.io/${person.portrait}` : undefined,
    sameAs
  });
}

function renderHeroSocial(profile) {
  const root = document.querySelector("[data-hero-social]");
  if (!root) return;
  const c = profile.contact || {};
  const handle = c.xLabel || "@nzml087";
  const items = [
    ["linkedin", "LinkedIn", c.linkedin],
    ["scholar", "Google Scholar", c.scholar],
    ["github", "GitHub", c.github],
    ["x", `X (${handle})`, c.x]
  ];
  root.replaceChildren();
  for (const [icon, label, href] of items) {
    if (isPlaceholder(href)) continue;
    const link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.title = label;
    link.setAttribute("aria-label", label);
    const glyph = iconSvg(icon);
    if (glyph) link.append(glyph);
    root.append(link);
  }
}

function prettyName(name) {
  return String(name || "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function initReveal() {
  const nodes = [...document.querySelectorAll(".reveal")].filter((node) => !node.hidden);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("is-in"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-in");
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.12 });
  nodes.forEach((node) => observer.observe(node));
}

function isPlaceholder(value) {
  const text = String(value || "").trim();
  return !text || /\bTODO\b/i.test(text);
}

function contactLink(label, value, href, iconName) {
  const item = document.createElement("li");
  const link = document.createElement("a");
  link.href = href;
  if (!href.startsWith("mailto:") && !href.startsWith("assets/")) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
  if (href.startsWith("assets/")) link.setAttribute("download", "");
  const glyph = iconSvg(iconName);
  if (glyph) link.append(glyph);
  const labelText = document.createElement("span");
  labelText.className = "contact-label";
  labelText.textContent = label;
  const text = document.createElement("span");
  text.className = "contact-value";
  text.textContent = value;
  link.append(labelText, text);
  item.append(link);
  return item;
}

function textLink(href, label, className, iconName) {
  const link = document.createElement("a");
  link.href = href;
  if (className) link.className = className;
  if (!href.startsWith("mailto:") && !href.startsWith("#") && !href.startsWith("assets/")) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
  if (className && className.includes("button") && href.startsWith("assets/")) link.setAttribute("download", "");
  if (iconName === "x") {
    link.title = "X (@nzml087)";
    link.setAttribute("aria-label", "X (@nzml087)");
  }
  const glyph = iconSvg(iconName);
  if (glyph) link.append(glyph);
  const span = document.createElement("span");
  span.textContent = label;
  link.append(span);
  return link;
}

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node && value != null) node.textContent = value;
}

