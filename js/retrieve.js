/**
 * Client-side answers from data/profile.json.
 * No network calls. An optional LLM endpoint is handled by the chat UI.
 */

const STOP = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "am",
  "do", "does", "did", "doing", "he", "his", "him", "she", "her", "they",
  "them", "their", "what", "where", "when", "who", "whom", "whose", "why",
  "how", "which", "can", "could", "would", "should", "i", "me", "my", "you",
  "your", "about", "of", "to", "in", "on", "for", "and", "or", "with", "at",
  "from", "has", "have", "had", "please", "tell", "that", "this", "there",
  "nazmul", "islam", "md", "mr", "dr"
]);

export function answerQuestion(profile, question) {
  const q = normalize(question);
  if (!q) {
    return { text: profile.chat.fallback, confident: false };
  }

  const named = matchProject(profile, q);
  if (named && !isBareProjectList(q)) {
    return { text: formatProject(named), confident: true };
  }
  if (isProjectListQuestion(q)) {
    return { text: formatAllProjects(profile), confident: true };
  }
  if (isContactQuestion(q)) {
    return { text: formatContact(profile), confident: true };
  }
  if (isResearchListQuestion(q)) {
    return { text: formatResearch(profile), confident: true };
  }
  if (isPublicationQuestion(q)) {
    return { text: formatPublications(profile), confident: true };
  }
  if (isSkillsQuestion(q)) {
    return { text: formatSkills(profile), confident: true };
  }

  const docs = buildDocs(profile);
  let best = null;
  for (const doc of docs) {
    const s = score(q, doc);
    if (!best || s > best.s) best = { doc, s };
  }

  if (!best || best.s < 4) {
    return { text: profile.chat.fallback, confident: false };
  }
  return { text: best.doc.text, confident: true };
}

export function buildDocs(profile) {
  const docs = [];

  docs.push({
    id: "about",
    title: profile.person.name,
    text: [profile.person.bio, ...profile.about.paragraphs].filter(Boolean).join("\n\n"),
    match: profile.about.match || []
  });

  docs.push({
    id: "location",
    title: profile.person.location,
    text: profile.locationNote.summary,
    match: profile.locationNote.match || []
  });

  for (const item of profile.research) {
    docs.push({
      id: `research:${item.id}`,
      title: item.title,
      text: `${item.title}. ${item.summary}`,
      match: item.match || []
    });
  }

  docs.push({
    id: "publications",
    title: "Selected publications",
    text: formatPublications(profile),
    match: ["publications", "papers", "published", "publication", "scholar"]
  });

  for (const job of profile.experience) {
    docs.push({
      id: `experience:${job.id}`,
      title: job.org,
      text: visitorText(job.summary),
      match: job.match || []
    });
  }

  docs.push({
    id: "skills",
    title: "Technical skills",
    text: formatSkills(profile),
    match: ["skills", "programming languages", "tech stack", "tools"]
  });

  for (const project of profile.projects) {
    docs.push({
      id: `project:${project.id}`,
      title: project.name,
      text: formatProject(project),
      match: project.match || []
    });
  }

  docs.push({
    id: "contact",
    title: "Contact",
    text: formatContact(profile),
    match: profile.contact.match || []
  });

  return docs;
}

function formatProject(project) {
  const lines = [`${project.name}${project.language ? ` (${project.language})` : ""}.`];
  const summary = visitorText(project.summary);
  if (summary) lines.push(summary);
  if (project.url) lines.push(project.url);
  if (project.demo) lines.push(`Live demo: ${project.demo}`);
  return lines.join("\n");
}

function formatAllProjects(profile) {
  const lines = ["Here are the public projects listed for Md Nazmul Islam.", ""];
  for (const project of profile.projects.filter((item) => item.available)) {
    const summary = visitorText(project.summary);
    lines.push(`• ${project.name}${project.language ? ` (${project.language})` : ""}${summary ? ` — ${summary}` : ""}`);
    if (project.url) lines.push(`  ${project.url}`);
    if (project.demo) lines.push(`  Live demo: ${project.demo}`);
  }
  return lines.join("\n");
}

function formatContact(profile) {
  const c = profile.contact;
  const lines = [
    `You can email ${profile.person.name} at ${c.email}.`,
    `GitHub: ${c.github}`,
    `LinkedIn: ${c.linkedin}`
  ];
  if (c.collaboration) lines.push(c.collaboration);
  const cv = visitorText(c.cv);
  if (cv) lines.push(`CV: ${cv}`);
  return lines.join("\n");
}

function visitorText(value) {
  const text = String(value || "").trim();
  if (!text || /\bTODO\b/i.test(text)) return "";
  return text;
}

function formatResearch(profile) {
  const lines = ["His research interests, from his public profile:", ""];
  for (const item of profile.research) {
    lines.push(`• ${item.title} — ${item.summary}`);
  }
  return lines.join("\n");
}

function formatPublications(profile) {
  const lines = ["Selected publications from his public profile:", ""];
  profile.publications.forEach((paper, index) => {
    const venue = paper.venue ? ` — ${paper.venue}` : "";
    lines.push(`${index + 1}. ${paper.title}${venue}`);
    if (paper.url) lines.push(`   ${paper.url}`);
  });
  return lines.join("\n");
}

function formatSkills(profile) {
  const lines = ["Technical skills from his public profile:", ""];
  for (const group of profile.skills) {
    lines.push(`• ${group.group}: ${group.items.join(", ")}`);
  }
  return lines.join("\n");
}

function matchProject(profile, q) {
  let best = null;
  for (const project of profile.projects) {
    const terms = [project.name, project.id, ...(project.match || [])];
    for (const term of terms) {
      if (!hasPhrase(q, term)) continue;
      const len = normalize(term).length;
      if (!best || len > best.len) best = { project, len };
    }
  }
  return best ? best.project : null;
}

function isBareProjectList(q) {
  if (!isProjectListQuestion(q)) return false;
  const stripped = q
    .replace(/\b(projects?|repos?|repositories|repository|github|built|build|made|created|portfolio|apps?|software)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const leftover = tokens(stripped);
  return leftover.length === 0;
}

function isProjectListQuestion(q) {
  return /\b(projects?|repos?|repositories|repository|built|portfolio)\b/.test(q);
}

function isContactQuestion(q) {
  return /\b(contact|email|e-mail|reach|linkedin|resume|cv|hire|collaborat\w*)\b/.test(q);
}

function isResearchListQuestion(q) {
  return /\b(research interests|areas of research|what does he research|what is his research|research focus|his research)\b/.test(q);
}

function isPublicationQuestion(q) {
  return /\b(publications?|papers?|published|scholar)\b/.test(q);
}

function isSkillsQuestion(q) {
  return /\b(skills?|programming languages?|tech stack|what languages)\b/.test(q);
}

function score(q, doc) {
  let s = 0;
  const title = normalize(doc.title);
  if (title && hasPhrase(q, title)) s += 8;

  for (const phrase of doc.match || []) {
    if (hasPhrase(q, phrase)) s += 6 + normalize(phrase).split(" ").length;
  }

  const qt = tokens(q);
  const blob = new Set(tokens(`${doc.title} ${doc.text} ${(doc.match || []).join(" ")}`).map(stem));
  let hits = 0;
  for (const raw of qt) {
    const t = stem(raw);
    if (blob.has(t)) {
      hits += 1;
      continue;
    }
    for (const b of blob) {
      if (close(b, t)) {
        hits += 0.8;
        break;
      }
    }
  }
  s += hits * 2;
  if (qt.length && hits >= qt.length) s += 1.5;
  return s;
}

function hasPhrase(q, phrase) {
  const p = normalize(phrase);
  if (!p) return false;
  if (p.includes(" ")) return q.includes(p);
  return new RegExp(`\\b${escapeRegExp(p)}\\b`).test(q);
}

export function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/ph\.?\s*d\.?/g, "phd")
    .replace(/\be-mail\b/g, "email")
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9+.#\s-]/g, " ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value) {
  return normalize(value)
    .split(" ")
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function stem(token) {
  if (token.length > 5 && token.endsWith("ing")) return token.slice(0, -3);
  if (token.length > 4 && token.endsWith("ed")) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
}

function close(a, b) {
  if (a === b) return true;
  if (a.length < 5 || b.length < 5) return false;
  if (Math.abs(a.length - b.length) > 2) return false;
  const limit = a.length > 7 ? 2 : 1;
  return levenshtein(a, b) <= limit;
}

function levenshtein(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i += 1) dp[i][0] = i;
  for (let j = 0; j < cols; j += 1) dp[0][j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
