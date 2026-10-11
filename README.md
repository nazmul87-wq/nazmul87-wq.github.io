# Md Nazmul Islam

Personal site for [nazmul87-wq.github.io](https://nazmul87-wq.github.io). It is a static site: HTML, CSS, and JavaScript, with no build step. GitHub Pages serves it from the root of `main`.

Family, friends, and colleagues can read the page or use **Ask about Nazmul**. The chat answers from the profile file in the browser. It does not need an API key.

## Edit the content

All personal content lives in [`data/profile.json`](data/profile.json). The page and the chat both read that file.

Change a fact there, commit, and push to `main`. Refresh the site. You do not need to edit the HTML for ordinary updates.

| What you want to change | Where |
| --- | --- |
| Name, title, location, short bio | `person` |
| Longer about text | `about.paragraphs` |
| Research interests | `research` |
| Papers | `publications` |
| Jobs | `experience` (use a `TODO:` string wherever a date or detail is still unknown) |
| Skills | `skills` |
| Projects | `projects` |
| Email, GitHub, LinkedIn, CV | `contact` |
| Suggested chat questions and the “I don’t know” line | `chat` |

`match` arrays are extra phrases that help the chat recognize a question. You can add everyday wording there (“where does he study”, “hugo”, “passport”) without changing the JavaScript.

### Photo

The portrait is the public GitHub avatar, saved at `assets/portrait.jpg`. Replace that file to use a different photo, and keep the same path (or change `person.portrait`). `person.portraitTodo` is the caption on the page.

### CV

`contact.cv` is empty on purpose. Add a URL, or put a PDF at `assets/cv.pdf` and set `contact.cv` to `assets/cv.pdf`. Until then the contact section shows the TODO from `contact.cvTodo`.

### Projects that were not on public GitHub

These names are in `projects` with `"available": false` because `nazmul87-wq/<name>` returned 404 from the public GitHub API when the site was built:

- Simple-Typescript-App-01 (described as online chess)
- bollywood-jigsaw-game
- ai-influencer-agents
- XervioLab_v1
- Ant-Game
- x-business-ideas-scout
- last-30-days-skill

They show under “Names still to confirm”. When you have a real URL and description, set `available` to `true`, fill `summary` and `url`, and clear or update `todo`.

Public repositories that are linked today:

- [multi-agent-system](https://github.com/nazmul87-wq/multi-agent-system)
- [orca-draw](https://github.com/nazmul87-wq/orca-draw) ([demo](https://nazmul87-wq.github.io/orca-draw/))
- [passport-photo-studio](https://github.com/nazmul87-wq/passport-photo-studio) ([demo](https://nazmul87-wq.github.io/passport-photo-studio/))
- [northstar-reader](https://github.com/nazmul87-wq/northstar-reader)
- [Nazmul-event-talks-app](https://github.com/nazmul87-wq/Nazmul-event-talks-app)

Descriptions for those five come from the GitHub API or each repository’s README. The profile text comes from the GitHub bio and from [nazmul87-wq/nazmul87-wq](https://github.com/nazmul87-wq/nazmul87-wq).

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

Leave the chat as it is if you do not want a model in the loop. To add one later, put a Cloudflare Worker in front of the model so the key stays on the server.

Example worker: [`workers/ask-nazmul.js`](workers/ask-nazmul.js). Example config: [`workers/wrangler.toml.example`](workers/wrangler.toml.example).

```bash
cd workers
cp wrangler.toml.example wrangler.toml
npx wrangler secret put LLM_API_KEY
npx wrangler deploy
```

The worker accepts `POST` JSON:

```json
{ "question": "Where does he study?", "context": "local answer", "profile": {} }
```

It returns `{ "answer": "..." }`. It calls an OpenAI-compatible `POST /chat/completions` endpoint using:

- `LLM_API_KEY` (secret)
- `LLM_BASE_URL` (default `https://api.openai.com/v1`)
- `LLM_MODEL` (default `gpt-4o-mini`)
- `ALLOWED_ORIGIN` (default `https://nazmul87-wq.github.io`; localhost is also allowed)

Then in `data/profile.json`:

```json
"llm": {
  "enabled": true,
  "endpoint": "https://ask-nazmul.<your-subdomain>.workers.dev"
}
```

If the worker fails or times out, the page still shows the local answer. Set `enabled` back to `false` to turn the model off. Do not commit `wrangler.toml` if you add account-specific values, and do not put the API key in `profile.json`.

## GitHub Pages

This repository is a user site. Pages should deploy from the **main** branch, folder **/** (root).

- `index.html` is at the repository root.
- `.nojekyll` is present so Jekyll does not rewrite the site.

In the repository settings, under Pages, choose “Deploy from a branch”, branch `main`, folder `/ (root)`. After the next push to `main`, the site is at https://nazmul87-wq.github.io.
