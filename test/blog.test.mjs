import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canonicalCategory, chooseCover, coverUrl, dropDuplicateTitle, markdownToHtml, newsPosts } from "../js/blog.js";

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

const icorps = readFileSync(new URL("../blog/posts/nsf-icorps-quantum-x.md", import.meta.url), "utf8");
const icorpsTitle = "We finished NSF I-Corps Quantum+X";
for (const sentence of [
  "On October 16, our team, Q BioSense, completed the National Science Foundation's I-Corps Quantum+X program.",
  "My PhD work at Kent State is in quantum sensing, and most of our time goes into whether a sensor works. I-Corps asked us a different question: who needs it, and what problem does it solve for them? Getting to an answer meant leaving the lab and talking to the people who might use the technology.",
  "The program also took us to Quantum World Congress 2026. We spent it meeting startups, potential collaborators, suppliers, and a few competitors. Seeing who builds what, and who buys it, gave us a clearer picture of where quantum sensing fits outside the lab than any paper has.",
  "Here's our team video:"
]) {
  assert.equal(icorps.includes(sentence), true, sentence);
}
assert.doesNotMatch(icorps, /\[(?:VIDEO|PHOTOS|CERTIFICATE)/);
const icorpsArticle = dropDuplicateTitle(icorps, icorpsTitle);
assert.equal(icorpsArticle.startsWith("On October 16,"), true);
assert.equal(icorpsArticle.includes(icorpsTitle), false);
const icorpsHtml = markdownToHtml(icorpsArticle);
assert.match(icorpsHtml, /Foundation\u2019s I-Corps/);
assert.match(icorpsHtml, /Here\u2019s our team video:/);
assert.match(
  icorpsHtml,
  /<figure class="post-video"><iframe src="https:\/\/www\.youtube\.com\/embed\/ZDbmKt-fsvk" title="Q BioSense Team4844 video" loading="lazy"/
);
assert.match(icorpsHtml, /<div class="post-gallery">/);
assert.equal((icorpsHtml.match(/<div class="post-gallery">/g) || []).length, 1);
assert.match(icorpsHtml, /alt="Group photo of the I-Corps cohort at Quantum World Congress 2026"/);
assert.match(icorpsHtml, /alt="Four people at the Quantum World Congress backdrop"/);
assert.match(icorpsHtml, /alt="Five people at a standing table at Quantum World Congress"/);
assert.match(icorpsHtml, /src="\.\.\/assets\/blog\/qwc-cohort\.jpg"/);
assert.match(icorpsHtml, /srcset="\.\.\/assets\/blog\/qwc-backdrop\.webp"/);
assert.match(icorpsHtml, /srcset="\.\.\/assets\/blog\/qwc-table\.webp"/);
assert.match(icorpsHtml, /loading="lazy" decoding="async"/);
assert.match(
  icorpsHtml,
  /<figure class="post-figure post-certificate"><a href="\.\.\/assets\/blog\/icorps-quantum-x-certificate\.pdf"><img src="\.\.\/assets\/blog\/icorps-quantum-x-certificate\.png" alt="NSF National I-Corps Quantum\+X Program certificate for Md\. Nazmul Islam, dated October 16, 2026" width="2000" height="1545" loading="lazy" decoding="async"><\/a><\/figure>/
);
const galleryAlts = [...icorpsHtml.matchAll(/post-gallery[\s\S]*?<\/div>/g)].join(" ");
assert.doesNotMatch(galleryAlts, /Nazmul|Islam|Kylie|Tao|Shen/);

const posts = JSON.parse(readFileSync(new URL("../blog/posts.json", import.meta.url), "utf8"));
const icorpsEntry = posts.posts.find((post) => post.slug === "nsf-icorps-quantum-x");
assert.equal(icorpsEntry.title, icorpsTitle);
assert.equal(icorpsEntry.date, "2026-10-17");
assert.equal(icorpsEntry.news, "Completed NSF I-Corps Quantum+X with Q BioSense");
assert.equal(icorpsEntry.category, "News");
assert.equal(posts.posts.find((post) => post.slug === "stop-slop-humanizer").category, "Posts");
assert.equal(posts.posts.find((post) => post.slug === "welcome").category, "Posts");
assert.equal(posts.posts.find((post) => post.slug === "qwc-2026").category, "News");
for (const post of posts.posts) assert.ok(post.category === "News" || post.category === "Posts", post.slug);

assert.equal(canonicalCategory("News"), "News");
assert.equal(canonicalCategory(" news "), "News");
assert.equal(canonicalCategory("Posts"), "Posts");
assert.equal(canonicalCategory(""), "Posts");
assert.equal(canonicalCategory("essay"), "Posts");

const sample = [
  { slug: "article", title: "Article", category: "Posts", date: "2026-10-18", news: "should not show" },
  { slug: "newer", title: "Newer", category: "News", published: "2026-10-17T12:00:00Z", news: "Headline" },
  { slug: "older", title: "Older", category: "News", date: "2026-10-01" },
  { slug: "unset", title: "Unset", date: "2026-10-19" }
];
assert.deepEqual(newsPosts(sample).map((post) => post.slug), ["newer", "older"]);
assert.deepEqual(
  newsPosts(posts.posts).map((post) => post.slug),
  ["nsf-icorps-quantum-x", "qwc-2026"]
);

const home = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const newsHtml = home.slice(home.indexOf("<!-- build:news -->"), home.indexOf("<!-- /build:news-dup -->"));
assert.match(newsHtml, /<a href="blog\/post\.html\?slug=nsf-icorps-quantum-x">Completed NSF I-Corps Quantum\+X with Q BioSense<\/a>/);
assert.match(newsHtml, /slug=qwc-2026/);
assert.doesNotMatch(newsHtml, /stop-slop-humanizer|slug=welcome/);

const blogIndex = readFileSync(new URL("../blog/index.html", import.meta.url), "utf8");
assert.match(blogIndex, /data-blog-filters/);
assert.match(blogIndex, /data-category="all"[^>]*>All</);
assert.match(blogIndex, /data-category="News"[^>]*>News</);
assert.match(blogIndex, /data-category="Posts"[^>]*>Posts</);

const cohortAlt = "Group photo of the I-Corps cohort at Quantum World Congress 2026";
assert.equal(icorpsEntry.cover, "assets/blog/qwc-cohort.webp");
assert.equal(icorpsEntry.coverAlt, cohortAlt);
assert.deepEqual(
  chooseCover({
    title: icorpsTitle,
    cover: icorpsEntry.cover,
    coverAlt: icorpsEntry.coverAlt,
    markdown: icorpsArticle
  }),
  { src: "assets/blog/qwc-cohort.webp", alt: cohortAlt, video: false }
);
assert.deepEqual(
  chooseCover({ title: "Customer discovery", markdown: qwcBody }),
  {
    src: "../assets/blog/qwc-2026.webp",
    alt: "Group photo at the Quantum World Congress 2026 photo wall in College Park, Maryland",
    video: false
  }
);
const qwcEntry = posts.posts.find((post) => post.slug === "qwc-2026");
assert.deepEqual(
  chooseCover({ title: qwcEntry.title, image: qwcEntry.image, imageAlt: qwcEntry.imageAlt, markdown: "![other](../assets/other.webp)" }),
  { src: qwcEntry.image, alt: qwcEntry.imageAlt, video: false }
);
assert.deepEqual(
  chooseCover({
    title: "Video only",
    markdown: '@[youtube](https://www.youtube.com/watch?v=ZDbmKt-fsvk "Q BioSense Team4844 video")'
  }),
  {
    src: "https://i.ytimg.com/vi/ZDbmKt-fsvk/hqdefault.jpg",
    alt: "Q BioSense Team4844 video",
    video: true
  }
);
assert.deepEqual(
  chooseCover({ title: "Short", markdown: "@[youtube](https://youtu.be/abcdefghijk)" }),
  { src: "https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg", alt: "Short", video: true }
);
assert.equal(chooseCover({ title: "Text", markdown: "Just words.\n```\n![hidden](secret.webp)\n```" }), null);
assert.equal(chooseCover({ title: title, markdown: article }), null);
assert.equal(coverUrl("assets/blog/qwc-cohort.webp", "../"), "../assets/blog/qwc-cohort.webp");
assert.equal(coverUrl("../assets/blog/qwc-cohort.webp", "../"), "../assets/blog/qwc-cohort.webp");
assert.equal(coverUrl("https://i.ytimg.com/vi/ZDbmKt-fsvk/hqdefault.jpg", "../"), "https://i.ytimg.com/vi/ZDbmKt-fsvk/hqdefault.jpg");

console.log("blog markdown ok");
