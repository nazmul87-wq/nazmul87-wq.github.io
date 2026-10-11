import { answerQuestion } from "./retrieve.js";

const LLM_TIMEOUT_MS = 8000;

export function initChat(profile) {
  const root = document.querySelector("[data-ask]");
  if (!root) return;

  const launchers = document.querySelectorAll("[data-ask-open]");
  const panel = root.querySelector(".ask-panel");
  const log = root.querySelector(".ask-log");
  const chips = root.querySelector(".ask-chips");
  const form = root.querySelector(".ask-form");
  const input = root.querySelector(".ask-input");
  const closeBtn = root.querySelector(".ask-close");
  const launcher = root.querySelector(".ask-launch");

  let lastFocus = null;

  function setOpen(open) {
    panel.hidden = !open;
    root.classList.toggle("is-open", open);
    launcher.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      lastFocus = document.activeElement;
      input.focus();
    } else if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
  }

  function addMessage(role, text) {
    const item = document.createElement("div");
    item.className = `ask-msg ask-msg-${role}`;
    const label = document.createElement("span");
    label.className = "ask-msg-label";
    label.textContent = role === "user" ? "You" : "About Nazmul";
    const body = document.createElement("div");
    body.className = "ask-msg-body";
    appendRichText(body, text);
    item.append(label, body);
    log.append(item);
    log.scrollTop = log.scrollHeight;
    return item;
  }

  function ask(raw) {
    const question = String(raw || "").trim();
    if (!question) return;
    addMessage("user", question);
    input.value = "";

    const local = answerQuestion(profile, question);
    const llm = profile.chat && profile.chat.llm;
    if (llm && llm.enabled && llm.endpoint) {
      const pending = addMessage("assistant", "Checking the optional assistant…");
      askLlm(llm.endpoint, question, local.text, profile)
        .then((remote) => {
          pending.querySelector(".ask-msg-body").replaceChildren();
          appendRichText(pending.querySelector(".ask-msg-body"), remote || local.text);
        })
        .catch(() => {
          pending.querySelector(".ask-msg-body").replaceChildren();
          appendRichText(
            pending.querySelector(".ask-msg-body"),
            `${local.text}\n\nThe optional assistant did not respond, so this answer is from the on-page profile.`
          );
        });
      return;
    }
    addMessage("assistant", local.text);
  }

  addMessage("assistant", profile.chat.greeting);

  for (const suggestion of profile.chat.suggestions || []) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "ask-chip";
    chip.textContent = suggestion;
    chip.addEventListener("click", () => {
      setOpen(true);
      ask(suggestion);
    });
    chips.append(chip);
  }

  launcher.addEventListener("click", () => setOpen(panel.hidden));
  for (const extra of launchers) {
    extra.addEventListener("click", () => setOpen(true));
  }
  closeBtn.addEventListener("click", () => setOpen(false));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    ask(input.value);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      event.preventDefault();
      setOpen(false);
    }
  });
}

async function askLlm(endpoint, question, context, profile) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        question,
        context,
        profile
      })
    });
    if (!response.ok) throw new Error("llm");
    const data = await response.json();
    if (!data || typeof data.answer !== "string" || !data.answer.trim()) {
      throw new Error("empty");
    }
    return data.answer.trim();
  } finally {
    clearTimeout(timer);
  }
}

function appendRichText(container, text) {
  const parts = String(text).split(/(https?:\/\/[^\s]+|[\w.+-]+@[\w.-]+\.[a-z]{2,})/gi);
  for (const part of parts) {
    if (!part) continue;
    if (/^https?:\/\//i.test(part)) {
      const link = document.createElement("a");
      link.href = part;
      link.textContent = part;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      container.append(link);
    } else if (/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(part)) {
      const link = document.createElement("a");
      link.href = `mailto:${part}`;
      link.textContent = part;
      container.append(link);
    } else {
      container.append(document.createTextNode(part));
    }
  }
}
