import { initChat } from "./chat.js";

const THEME_KEY = "nazmul-theme";

initThemeToggle();
initNav();

const status = document.querySelector("[data-status]");

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

async function loadProfile() {
  const response = await fetch("data/profile.json", { cache: "no-cache" });
  if (!response.ok) throw new Error("profile");
  return response.json();
}

function renderProfile(profile) {
  const person = profile.person;
  document.title = `${person.name} · Portfolio`;

  setText("[data-name]", person.name);
  setText("[data-given]", person.givenName);
  setText("[data-title]", person.title);
  setText("[data-field]", person.field);
  setText("[data-affiliation]", person.affiliation);
  setText("[data-location]", person.location);
  setText("[data-bio]", person.bio);
  setText("[data-year]", String(new Date().getFullYear()));

  const emailLink = document.querySelector("[data-email-link]");
  if (emailLink) emailLink.href = `mailto:${profile.contact.email}`;
  const githubLink = document.querySelector("[data-github-link]");
  if (githubLink) githubLink.href = profile.contact.github;

  const portrait = document.querySelector("[data-portrait]");
  if (portrait) {
    portrait.src = person.portrait;
    portrait.alt = person.portraitAlt || person.name;
  }
  setText("[data-portrait-todo]", person.portraitTodo);

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
  renderResearch(profile.research);
  renderPublications(profile.publications);
  renderExperience(profile.experience);
  renderProjects(profile.projects);
  renderContact(profile);
}

function renderSkills(groups) {
  const root = document.querySelector("[data-skills]");
  if (!root) return;
  root.replaceChildren();
  for (const group of groups) {
    const item = document.createElement("li");
    const name = document.createElement("span");
    name.className = "skill-label";
    name.textContent = group.group;
    const values = document.createElement("span");
    values.textContent = group.items.join(" · ");
    item.append(name, values);
    root.append(item);
  }
}

function renderResearch(items) {
  const root = document.querySelector("[data-research]");
  if (!root) return;
  root.replaceChildren();
  items.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "info-card";
    const kicker = document.createElement("p");
    kicker.className = "kicker";
    kicker.textContent = String(index + 1).padStart(2, "0");
    const title = document.createElement("h3");
    title.textContent = item.title;
    const summary = document.createElement("p");
    summary.textContent = item.summary;
    card.append(kicker, title, summary);
    root.append(card);
  });
}

function renderPublications(papers) {
  const root = document.querySelector("[data-publications]");
  if (!root) return;
  root.replaceChildren();
  papers.forEach((paper) => {
    const item = document.createElement("li");
    const title = document.createElement("a");
    title.href = paper.url;
    title.target = "_blank";
    title.rel = "noopener noreferrer";
    title.textContent = paper.title;
    item.append(title);
    if (paper.venue) {
      const venue = document.createElement("span");
      venue.className = "venue";
      venue.textContent = paper.venue;
      item.append(venue);
    }
    root.append(item);
  });
}

function renderExperience(jobs) {
  const root = document.querySelector("[data-experience]");
  if (!root) return;
  root.replaceChildren();
  for (const job of jobs) {
    const item = document.createElement("article");
    item.className = "job";
    const head = document.createElement("div");
    head.className = "job-head";
    const org = document.createElement("h3");
    org.textContent = job.org;
    const dates = document.createElement("p");
    dates.className = /todo/i.test(job.dates || "") ? "todo" : "dates";
    dates.textContent = job.dates;
    head.append(org, dates);

    const role = document.createElement("p");
    role.className = "job-role";
    role.textContent = job.role;

    const focus = document.createElement("p");
    focus.className = "job-focus";
    const place = [job.focus, job.location].filter(Boolean).join(" · ");
    focus.textContent = place;

    const summary = document.createElement("p");
    summary.textContent = job.summary;

    item.append(head, role, focus, summary);
    if (job.todo) {
      const todo = document.createElement("p");
      todo.className = "todo";
      todo.textContent = job.todo;
      item.append(todo);
    }
    root.append(item);
  }
}

function renderProjects(projects) {
  const grid = document.querySelector("[data-projects]");
  const pending = document.querySelector("[data-pending-projects]");
  if (grid) {
    grid.replaceChildren();
    for (const project of projects.filter((item) => item.available)) {
      grid.append(projectCard(project));
    }
  }
  if (pending) {
    pending.replaceChildren();
    for (const project of projects.filter((item) => !item.available)) {
      const item = document.createElement("li");
      const name = document.createElement("strong");
      name.textContent = project.name;
      item.append(name);
      if (project.summary) {
        item.append(document.createTextNode(` — ${project.summary}`));
      }
      if (project.todo) {
        const note = document.createElement("span");
        note.className = "todo";
        note.textContent = project.todo;
        item.append(note);
      }
      pending.append(item);
    }
  }
}

function projectCard(project) {
  const card = document.createElement("article");
  card.className = "project-card";
  const top = document.createElement("div");
  top.className = "project-top";
  const lang = document.createElement("span");
  lang.className = "pill";
  lang.textContent = project.language || "Project";
  top.append(lang);
  const title = document.createElement("h3");
  title.textContent = project.name;
  const summary = document.createElement("p");
  summary.textContent = project.summary;
  const links = document.createElement("div");
  links.className = "project-links";
  if (project.url) links.append(textLink(project.url, "Repository"));
  if (project.demo) links.append(textLink(project.demo, "Live demo"));
  card.append(top, title, summary, links);
  return card;
}

function renderContact(profile) {
  const root = document.querySelector("[data-contact]");
  if (!root) return;
  const c = profile.contact;
  root.replaceChildren();

  root.append(contactCard("Email", c.email, `mailto:${c.email}`));
  root.append(contactCard("GitHub", c.githubLabel, c.github));
  root.append(contactCard("LinkedIn", c.linkedinLabel, c.linkedin));

  const note = document.querySelector("[data-collaboration]");
  if (note) note.textContent = c.collaboration;

  const cv = document.querySelector("[data-cv]");
  if (cv) {
    cv.replaceChildren();
    if (c.cv) {
      const link = textLink(c.cv, "Download CV");
      cv.append(link);
    } else {
      const todo = document.createElement("p");
      todo.className = "todo";
      todo.textContent = c.cvTodo;
      cv.append(todo);
    }
  }
}

function contactCard(label, value, href) {
  const link = document.createElement("a");
  link.className = "contact-card";
  link.href = href;
  if (!href.startsWith("mailto:")) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
  const kicker = document.createElement("span");
  kicker.textContent = label;
  const text = document.createElement("strong");
  text.textContent = value;
  link.append(kicker, text);
  return link;
}

function textLink(href, label) {
  const link = document.createElement("a");
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = label;
  return link;
}

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node && value != null) node.textContent = value;
}

function initNav() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

function initThemeToggle() {
  const button = document.querySelector("[data-theme-toggle]");
  if (!button) return;
  const sync = () => {
    const theme = document.documentElement.dataset.theme || "light";
    button.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    button.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#101114" : "#f6f3ec");
  };
  sync();
  button.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* private mode */
    }
    sync();
  });
}
