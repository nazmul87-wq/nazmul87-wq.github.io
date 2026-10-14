// The bench joint is this site's signature. Scroll sets the angle of the
// distal link. While Publications is on screen, fast scrolling thickens a
// damper arc: velocity-modulated resistance, from the ASME orthosis paper.
// The engine is not involved. Reduced motion keeps a resting angle.

const REST_ANGLE = 28;

export function initJoint() {
  const bench = document.querySelector("[data-bench]");
  const nav = document.querySelector("[data-nav]");
  if (!bench && !nav) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const links = nav
    ? [...nav.querySelectorAll("a[href^='#']")].filter((link) => document.querySelector(link.getAttribute("href")))
    : [];
  const now = document.querySelector("[data-folio-now]");
  let lastY = window.scrollY;
  let lastT = performance.now();
  let resist = 0;
  let frame = 0;

  const papers = document.querySelector("#publications");

  function chapterLabel() {
    const mark = window.innerHeight * 0.34;
    let current = null;
    for (const link of links) {
      const section = document.querySelector(link.getAttribute("href"));
      if (!section || section.hidden) continue;
      const top = section.getBoundingClientRect().top;
      if (top - 8 <= mark) current = link;
    }
    for (const link of links) {
      if (link === current) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    }
    if (now) {
      const title = current ? current.textContent.trim() : "";
      if (now.textContent !== title) now.textContent = title;
    }
  }

  function papersOnScreen() {
    if (!papers || papers.hidden) return false;
    const box = papers.getBoundingClientRect();
    return box.bottom > 80 && box.top < window.innerHeight - 40;
  }

  function apply(angle, damp) {
    if (!bench) return;
    bench.style.setProperty("--joint-angle", `${angle.toFixed(2)}deg`);
    bench.style.setProperty("--joint-resist", damp.toFixed(3));
  }

  function tick(time) {
    chapterLabel();
    if (!reduce && bench) {
      const y = window.scrollY;
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, y / max));
      const angle = -16 + progress * 74;
      const dt = Math.max(time - lastT, 16);
      const velocity = Math.abs(y - lastY) / dt;
      lastY = y;
      lastT = time;
      const target = papersOnScreen() ? Math.min(1, Math.max(0, (velocity - 0.25) / 1.4)) : 0;
      resist += (target - resist) * 0.18;
      if (resist < 0.01) resist = 0;
      apply(angle, resist);
    }
    if (!document.hidden) frame = requestAnimationFrame(tick);
  }

  if (reduce) {
    apply(REST_ANGLE, 0);
    chapterLabel();
    document.addEventListener("scroll", chapterLabel, { passive: true });
    window.addEventListener("resize", chapterLabel);
    return;
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) frame = requestAnimationFrame(tick);
    else if (frame) cancelAnimationFrame(frame);
  });
  frame = requestAnimationFrame(tick);
}
