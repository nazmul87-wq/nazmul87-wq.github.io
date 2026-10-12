# Md Nazmul Islam

Personal site for [nazmulislam-lab.github.io](https://nazmulislam-lab.github.io). It is a static site: HTML, CSS, and JavaScript. GitHub Pages serves it from the root of `main`. There is no bundler. After you edit `data/profile.json`, run `node scripts/build.mjs` so the prerendered HTML stays in sync for crawlers. The page still refreshes itself from the JSON when JavaScript runs.

Family, friends, and colleagues can read the page or use **Ask about Nazmul**. The chat answers from the profile file in the browser. It does not need an API key.

## Edit the content

All personal content lives in [`data/profile.json`](data/profile.json). The page and the chat both read that file.

Change a fact there, run `node scripts/build.mjs`, commit, and push to `main`. Refresh the site. You do not need to edit the HTML by hand for ordinary updates.

| What you want to change | Where |
| --- | --- |
| Name, title, location, short bio, hero line, keywords | `person` (`valueStatement`, `keywords`) |
| Longer about text | `about.paragraphs` |
| Research interests | `research` |
| Education | `education` (`school`, `degree`, `dates`, `gpa`, `standing`, `thesis`, `advisor`). Leave a field `""` to hide it. |
| Papers | `publications` (the section hides when this and `talks` are both empty). A paper is `{ "title", "authors": [], "type": "journal" or "conference", "venue", "year", "date", "url" }`. The page bolds the name in `person.name` inside each author list. `url` should be the paper’s DOI link; leave it empty only if you cannot find one. |
| Talks | `talks` (leave `[]` until you have a real talk) |
| Jobs | `experience`. `dates` is the timeline label (for example `Aug 2024 – Present`). `duties` is the bullet list. Leave `dates` as `""` only when a range is unknown. |
| Skills | `skills` |
| Projects | `projects` (`image` is the card preview) |
| Email, GitHub, LinkedIn, X, WhatsApp, Google Scholar, CV | `contact`. LinkedIn is `https://www.linkedin.com/in/nazmul87/`. X is `contact.x` (`https://x.com/nzml087`) and `contact.xLabel` (`@nzml087`). WhatsApp is `contact.whatsapp` (`https://wa.me/12342829758`) and `contact.whatsappLabel` (`+1 234-282-9758`); a social button hides if its URL is empty. `scholar` is the Google Scholar profile URL. `cv` is `assets/cv.pdf`. |
| Hobbies, hometown, gallery | `beyond` (the section hides until something is filled) |
| Suggested chat questions and the “I don’t know” line | `chat` |

`match` arrays are extra phrases that help the chat recognize a question. You can add everyday wording there (“where does he study”, “hugo”, “passport”) without changing the JavaScript.

### Photo

The hero portrait is a fixed frame (`assets/portrait.jpg`, or whatever path you set on `person.portrait`). Drop a professional headshot in that same file and it will crop to fill the frame. The current image is the public GitHub profile photo. There is no caption.

### Fields that stay hidden until you fill them in

Empty strings are not shown on the page or in the chat. Do not put notes like “TODO” in `data/profile.json`; visitors would see them. Keep editor notes in this README.

- **CV file.** `assets/cv.pdf` is the CV he approved for download. Replace that file and keep `contact.cv` set to `assets/cv.pdf`. The hero and contact section show Download CV only when `contact.cv` is set.
- **Not on the page.** The street address and the references’ email addresses stay in the PDF only. Do not copy them into `profile.json`.
- **Blank on purpose.** The CV marks the Kent State thesis and academic standing as NA, so those `education` fields are `""` and stay hidden. There is no awards or test-score section because the CV does not list any.
- **Talks.** `talks` is `[]`. A talk is `{ "title": "", "event": "", "year": "", "url": "" }`. Empty `url` still shows the title. The talks list stays hidden until at least one title is set. No public talks were found in the profile or repos.
- **Beyond work.** `beyond.intro`, `beyond.hometown`, `beyond.hobbies`, and `beyond.gallery` are empty, so the section is hidden. A gallery photo is `{ "src": "assets/gallery/photo.jpg", "alt": "Describe the photo" }`. Fill any of those fields to show the section.
- **Link preview.** Shared links use `assets/og.jpg` (1200×630). Replace that file if you want a different preview image.

### Projects that were not on public GitHub

These names are in `projects` with `"available": false` because `nazmulislam-lab/<name>` returned 404 from the public GitHub API when the site was built. They are omitted from the projects section and from the “what projects has he built?” answer:

- Simple-Typescript-App-01 (described as online chess; `summary` is kept so a direct question can still answer)
- bollywood-jigsaw-game
- ai-influencer-agents
- XervioLab_v1
- Ant-Game
- x-business-ideas-scout
- last-30-days-skill

When you have a real URL and description, set `available` to `true`, fill `summary` and `url`, and add an `image` (a screenshot, a GIF, or a cover such as `assets/projects/nazmul-event-talks-app.svg`). Card previews already in the repo:

- `orca-draw` and `passport-photo-studio` are screenshots of the live GitHub Pages demos.
- `multi-agent-system` is a frame from `docs/demo.gif` in that repo.
- `northstar-reader` is the screenshot from that repo’s README.
- `Nazmul-event-talks-app` uses a generated cover because it has no public demo.

Public repositories that are linked today:

- [multi-agent-system](https://github.com/nazmulislam-lab/multi-agent-system)
- [orca-draw](https://github.com/nazmulislam-lab/orca-draw) ([demo](https://nazmulislam-lab.github.io/orca-draw/))
- [passport-photo-studio](https://github.com/nazmulislam-lab/passport-photo-studio) ([demo](https://nazmulislam-lab.github.io/passport-photo-studio/))
- [northstar-reader](https://github.com/nazmulislam-lab/northstar-reader)
- [Nazmul-event-talks-app](https://github.com/nazmulislam-lab/Nazmul-event-talks-app)

Descriptions for those five come from the GitHub API or each repository’s README. The profile text comes from the GitHub bio and from [nazmulislam-lab/nazmulislam-lab](https://github.com/nazmulislam-lab/nazmulislam-lab).

## Add a blog post

Posts live in [`blog/posts/`](blog/posts/) as Markdown. There is no build step. GitHub Pages serves them because `.nojekyll` is in the repo root.

1. Add `blog/posts/my-note.md` with this shape:

```markdown
---
title: My note
date: 2026-10-11
tags: robotics, ai
---

The note, in first person. Use only facts already on the site or in the CV.
```

2. Add an entry to [`blog/posts.json`](blog/posts.json): `"slug"`, `"title"`, `"date"`, `"tags"`, and `"file"` (for example `posts/my-note.md`). The slug is the `?slug=` value on `blog/post.html`.
3. Add an `<item>` to [`feed.xml`](feed.xml) with the same title, date, and link `https://nazmulislam-lab.github.io/blog/post.html?slug=my-note`.
4. Commit and push. The blog index and the post page read `posts.json`. Run `node scripts/build.mjs` so the news band under the hero includes the new post.
5. Optional cover: set `"image"` and `"imageAlt"` on the `posts.json` entry. Paths are from the site root, for example `assets/blog/photo.webp`.
6. Optional order: set `"published"` to an ISO datetime when two posts share a `date`. Newer `published` values sort first on the blog index, in the news band, and in `feed.xml`.

## Latest news

The band under the hero scrolls the five newest titles from [`blog/posts.json`](blog/posts.json), newest first. Each title links to that post, with a dot between items. Fewer than five posts shows whatever exists. The band is hidden when there are no posts. After you add or remove a post, run `node scripts/build.mjs` so `index.html` matches.

Markdown supported in the browser: paragraphs, `#` / `##` / `###` headings, `-` lists, `**bold**`, `*italic*`, and links. Reading time is about 200 words a minute.

## Preview locally

From this folder:

```bash
python3 -m http.server 8765
```

Open [http://127.0.0.1:8765](http://127.0.0.1:8765). Opening `index.html` as a file will not load `data/profile.json`.

Check the chat answers with:

```bash
node test/retrieve.test.mjs
```

## How the chat works

Ask about Nazmul runs entirely in the browser:

1. `js/main.js` loads `data/profile.json` and fills the page.
2. `js/chat.js` sends the question to `js/retrieve.js`.
3. The retriever looks for a specific project name, then for list-style questions (projects, contact, research, papers, skills).
4. Otherwise it scores each section with phrase matches from `match`, overlapping words, light stemming, and a small typo tolerance.
5. If nothing scores high enough, it shows `chat.fallback` and the suggested questions stay on screen as chips.

No key is shipped to visitors. `chat.llm.enabled` is `false` and `chat.llm.endpoint` is empty.

## Optional AI backend

The chat answers in the browser by default. No key is required, and nothing is called until you opt in.

To put a model behind it, deploy [`workers/ask-nazmul.js`](workers/ask-nazmul.js) on the Cloudflare Workers free tier. The worker calls an OpenAI-compatible chat API, grounds the model on the profile JSON the page sends, allows `https://nazmulislam-lab.github.io` (plus localhost for a local preview), and allows 10 questions per minute per IP. The API key stays in a Worker secret.

1. Install Wrangler if you do not have it: `npm install -g wrangler` (or use `npx wrangler`).
2. Log in: `npx wrangler login`.
3. From the `workers/` folder, copy the example config: `cp wrangler.toml.example wrangler.toml`.
4. Store the key (this does not go in git): `npx wrangler secret put LLM_API_KEY`.
5. Optional: in `wrangler.toml`, change `LLM_BASE_URL`, `LLM_MODEL`, or `ALLOWED_ORIGIN`. The default model URL is `https://api.openai.com/v1` and the default model is `gpt-4o-mini`.
6. Deploy: `npx wrangler deploy`.
7. Copy the `https://….workers.dev` URL from the deploy output.
8. In `data/profile.json`, set `chat.llm.enabled` to `true` and `chat.llm.endpoint` to that URL.
9. Commit and push `data/profile.json` only. Do not commit `wrangler.toml` if it has account-specific values, and never put the API key in the profile file.

The page shows the local answer immediately. If the endpoint is empty, `enabled` is false, the worker returns an error, the rate limit trips, or the request times out, that local answer stays. Set `enabled` back to `false` to stop calling the worker.

The worker accepts `POST` JSON `{ "question", "context", "profile" }` and returns `{ "answer" }`.

## GitHub Pages

This repository is a user site. Pages should deploy from the **main** branch, folder **/** (root).

- `index.html` is at the repository root.
- `.nojekyll` is present so Jekyll does not rewrite the site.

In the repository settings, under Pages, choose “Deploy from a branch”, branch `main`, folder `/ (root)`. After the next push to `main`, the site is at https://nazmulislam-lab.github.io.
