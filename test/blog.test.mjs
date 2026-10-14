import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dropDuplicateTitle, markdownToHtml } from "../js/blog.js";

const post = readFileSync(new URL("../blog/posts/stop-slop-humanizer.md", import.meta.url), "utf8");
const title = "Two Claude skills that fix how AI writes my emails";
const article = dropDuplicateTitle(post, title);
assert.equal(article.startsWith("I use Claude to draft email."), true);
assert.equal(article.includes(title), false);

const html = markdownToHtml(article);
assert.match(html, /<h3>The problem email<\/h3>/);
assert.match(html, /<h3>stop-slop writes a cleaner draft<\/h3>/);
assert.match(html, /<h3>Humanizer edits what you have<\/h3>/);
assert.match(html, /<h3>My setup<\/h3>/);
assert.match(html, /<h3>Installing them<\/h3>/);
assert.equal((html.match(/<blockquote>/g) || []).length, 3);
assert.match(html, /<br>Nazmul/);
assert.match(
  html,
  /<pre><code class="language-bash">git clone https:\/\/github.com\/blader\/humanizer\.git ~\/\.claude\/skills\/humanizer\ngit clone https:\/\/github.com\/hardikpandya\/stop-slop\.git ~\/\.claude\/skills\/stop-slop<\/code><\/pre>/
);
assert.doesNotMatch(html, /<p>&gt;/);
assert.doesNotMatch(html, /```/);

const welcome = readFileSync(new URL("../blog/posts/welcome.md", import.meta.url), "utf8");
const welcomeBody = welcome.replace(/^---\n[\s\S]*?\n---\n?/, "").trim();
const welcomeHtml = markdownToHtml(welcomeBody);
assert.match(welcomeHtml, /^<p>I’m Md Nazmul Islam/);
assert.doesNotMatch(welcomeHtml, /blockquote|<pre/);

const qwc = readFileSync(new URL("../blog/posts/qwc-2026.md", import.meta.url), "utf8");
const qwcBody = qwc.replace(/^---\n[\s\S]*?\n---\n?/, "").trim();
const qwcHtml = markdownToHtml(qwcBody);
assert.match(qwcHtml, /<figure class="post-figure"><picture><source srcset="\.\.\/assets\/blog\/qwc-2026\.webp"/);
assert.match(qwcHtml, /quantumworldcongress\.com/);
assert.doesNotMatch(qwcHtml, /blockquote|<pre/);

console.log("blog markdown ok");
