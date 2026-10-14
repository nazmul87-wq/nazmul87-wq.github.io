import { initChrome } from "./chrome.js";
import { paintIcons, renderFooterSocial } from "./icons.js";

const WORDS_PER_MINUTE = 200;

export async function loadPosts(manifestUrl) {
  const response = await fetch(manifestUrl, { cache: "no-cache" });
  if (!response.ok) throw new Error("posts");
  const data = await response.json();
  const base = manifestUrl.replace(/[^/]*$/, "");
  const posts = [];
  for (const entry of data.posts || []) {
    if (!entry || !entry.slug || !entry.file) continue;
    const fileResponse = await fetch(base + entry.file, { cache: "no-cache" });
    if (!fileResponse.ok) continue;
    const parsed = parsePost(await fileResponse.text(), entry);
    posts.push(parsed);
  }
  posts.sort((a, b) => postRank(b).localeCompare(postRank(a)));
  return posts;
}

function postRank(post) {
  return String(post.published || post.date || "");
}

export function postHref(slug, prefix = "") {
  return `${prefix}post.html?slug=${encodeURIComponent(slug)}`;
}

export function renderPostCards(root, posts, prefix = "", assetPrefix = "") {
  root.replaceChildren();
  for (const post of posts) {
    const card = document.createElement("article");
    card.className = "post-card";
    if (post.image) {
      const cover = document.createElement("a");
      cover.className = "post-cover";
      cover.href = postHref(post.slug, prefix);
      const img = document.createElement("img");
      const src = `${assetPrefix}${post.image}`;
      img.src = src;
      img.alt = post.imageAlt || "";
      img.loading = "lazy";
      img.decoding = "async";
      cover.append(img);
      card.append(cover);
    }
    const title = document.createElement("h3");
    const link = document.createElement("a");
    link.href = postHref(post.slug, prefix);
    link.textContent = post.title;
    title.append(link);
    const meta = document.createElement("p");
    meta.className = "post-meta";
    meta.textContent = [formatPostDate(post.date), readingLabel(post.minutes), post.tags.join(" · ")]
      .filter(Boolean)
      .join(" · ");
    const excerpt = document.createElement("p");
    excerpt.textContent = post.excerpt;
    card.append(title, meta, excerpt);
    root.append(card);
  }
}

export function renderPost(root, post) {
  root.replaceChildren();
  const kicker = document.createElement("p");
  kicker.className = "kicker";
  kicker.textContent = "Blog";
  const title = document.createElement("h1");
  title.textContent = post.title;
  const meta = document.createElement("p");
  meta.className = "post-meta";
  meta.textContent = [formatPostDate(post.date), readingLabel(post.minutes)].filter(Boolean).join(" · ");
  const tags = document.createElement("ul");
  tags.className = "interests";
  for (const tag of post.tags) {
    const li = document.createElement("li");
    li.textContent = tag;
    tags.append(li);
  }
  const body = document.createElement("div");
  body.className = "prose post-body";
  body.innerHTML = post.html;
  root.append(kicker, title, meta);
  if (post.tags.length) root.append(tags);
  root.append(body);
}

function sentenceExcerpt(plain, max) {
  const text = String(plain || "").trim();
  if (text.length <= max) return text;
  const slice = text.slice(0, max + 1);
  const marks = [...slice.matchAll(/[.!?](?=\s|$)/g)];
  if (marks.length) return text.slice(0, marks[marks.length - 1].index + 1).trim();
  const end = text.search(/[.!?](?=\s|$)/);
  if (end > 0) return text.slice(0, end + 1).trim();
  const space = slice.lastIndexOf(" ");
  return `${(space > 40 ? slice.slice(0, space) : slice).trim()}…`;
}

function parsePost(source, entry) {
  const { meta, body } = splitFrontMatter(source);
  const title = meta.title || entry.title || "Untitled";
  const date = meta.date || entry.date || "";
  const tags = meta.tags || entry.tags || [];
  const article = dropDuplicateTitle(body, title);
  const html = markdownToHtml(article);
  const plain = article
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/[#>*_\[\]()`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = plain ? plain.split(" ").length : 0;
  return {
    slug: entry.slug,
    title,
    date,
    tags,
    image: entry.image || meta.image || "",
    imageAlt: entry.imageAlt || meta.imageAlt || "",
    published: entry.published || meta.published || "",
    html,
    excerpt: sentenceExcerpt(plain, 180),
    minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE))
  };
}

function splitFrontMatter(source) {
  const match = String(source).match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { meta: {}, body: String(source).trim() };
  const meta = {};
  for (const line of match[1].split("\n")) {
    const cut = line.indexOf(":");
    if (cut === -1) continue;
    const key = line.slice(0, cut).trim();
    const value = line.slice(cut + 1).trim();
    if (key === "tags") meta.tags = value.split(",").map((tag) => tag.trim()).filter(Boolean);
    else meta[key] = value;
  }
  return { meta, body: source.slice(match[0].length).trim() };
}

export function dropDuplicateTitle(body, title) {
  const source = String(body).trim();
  const match = source.match(/^#\s+([^\n]+)\n*/);
  if (!match || match[1].trim() !== String(title).trim()) return source;
  return source.slice(match[0].length).trim();
}

export function markdownToHtml(markdown) {
  const lines = String(markdown).replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let list = [];
  let quote = [];
  let code = null;
  const flushList = () => {
    if (!list.length) return;
    html.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`);
    list = [];
  };
  const flushQuote = () => {
    if (!quote.length) return;
    const paragraphs = [];
    let current = [];
    const flushParagraph = () => {
      if (!current.length) return;
      paragraphs.push(`<p>${current.map((line) => inline(line)).join("<br>")}</p>`);
      current = [];
    };
    for (const line of quote) {
      if (!line.trim()) flushParagraph();
      else current.push(line);
    }
    flushParagraph();
    html.push(`<blockquote>${paragraphs.join("")}</blockquote>`);
    quote = [];
  };
  const flushCode = () => {
    if (!code) return;
    const lang = code.lang ? ` class="language-${escapeAttr(code.lang)}"` : "";
    html.push(`<pre><code${lang}>${escapeHtml(code.lines.join("\n"))}</code></pre>`);
    code = null;
  };
  for (const line of lines) {
    if (code) {
      if (/^```\s*$/.test(line)) flushCode();
      else code.lines.push(line);
      continue;
    }
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      flushList();
      flushQuote();
      code = { lang: fence[1], lines: [] };
      continue;
    }
    const quoted = line.match(/^>\s?(.*)$/);
    if (quoted) {
      flushList();
      quote.push(quoted[1]);
      continue;
    }
    flushQuote();
    const item = line.match(/^\s*[-*]\s+(.*)$/);
    if (item) {
      list.push(item[1]);
      continue;
    }
    flushList();
    if (!line.trim()) continue;
    const image = line.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/);
    if (image) {
      html.push(figureHtml(image[1], image[2], image[3] || ""));
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length + 1;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }
    html.push(`<p>${inline(line.trim())}</p>`);
  }
  flushList();
  flushQuote();
  flushCode();
  return html.join("");
}

function figureHtml(alt, src, caption) {
  const safeAlt = escapeHtml(alt);
  const safeSrc = escapeAttr(src);
  const jpg = safeSrc.replace(/\.webp$/i, ".jpg");
  const media = /\.webp$/i.test(safeSrc)
    ? `<picture><source srcset="${safeSrc}" type="image/webp"><img src="${jpg}" alt="${safeAlt}" width="1600" height="742"></picture>`
    : `<img src="${safeSrc}" alt="${safeAlt}" width="1600" height="742">`;
  const cap = caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : "";
  return `<figure class="post-figure">${media}${cap}</figure>`;
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function inline(text) {
  const escaped = escapeHtml(text);
  const curled = escaped
    .split(/(https?:\/\/[^\s)]+|`[^`]*`)/g)
    .map((part, index) => (index % 2 ? part : part.replace(/(\w)'(\w)/g, "$1\u2019$2")))
    .join("");
  return curled
    .replace(/`([^`]*)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*]+)\*(?=$|[\s).,])/g, "$1<em>$2</em>");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatPostDate(value) {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function readingLabel(minutes) {
  return `${minutes} min read`;
}

function initBlogPage() {
  const kind = document.body.dataset.blog;
  initChrome();
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
  paintIcons(document);
  fetch("../data/profile.json", { cache: "no-cache" })
    .then((response) => (response.ok ? response.json() : null))
    .then((profile) => {
      if (!profile) return;
      renderFooterSocial(document.querySelector("[data-footer-social]"), profile, {
        rssHref: "../feed.xml",
        assetPrefix: "../"
      });
    })
    .catch(() => {});

  if (kind === "index") {
    const root = document.querySelector("[data-blog-list]");
    const status = document.querySelector("[data-blog-status]");
    loadPosts("posts.json")
      .then((posts) => {
        if (status) status.hidden = true;
        if (!posts.length) {
          if (status) {
            status.hidden = false;
            status.textContent = "No posts yet.";
          }
          return;
        }
        renderPostCards(root, posts, "", "../");
      })
      .catch(() => {
        if (status) {
          status.hidden = false;
          status.textContent = "The posts could not be loaded. Open this page through a local server, not as a file.";
        }
      });
  }

  if (kind === "post") {
    const root = document.querySelector("[data-blog-post]");
    const slug = new URLSearchParams(location.search).get("slug");
    loadPosts("posts.json")
      .then((posts) => {
        const post = posts.find((item) => item.slug === slug);
        if (!post || !root) {
          if (root) {
            const p = document.createElement("p");
            p.textContent = "That post is not on this site.";
            root.replaceChildren(p);
          }
          return;
        }
        document.title = `${post.title} · Md Nazmul Islam`;
        renderPost(root, post);
      })
      .catch(() => {
        if (!root) return;
        const p = document.createElement("p");
        p.textContent = "The post could not be loaded. Open this page through a local server, not as a file.";
        root.replaceChildren(p);
      });
  }
}

if (typeof document !== "undefined" && document.body?.dataset.blog) initBlogPage();
