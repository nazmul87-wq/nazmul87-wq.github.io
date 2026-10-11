import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { answerQuestion } from "../js/retrieve.js";

const profile = JSON.parse(readFileSync(new URL("../data/profile.json", import.meta.url), "utf8"));

const cases = [
  ["Where does he study?", ["kent state", "phd", "tao shen", "4.00", "aug 2024"]],
  ["What does he teach?", ["mechatronics", "signal and electronics", "circuits labs"]],
  ["What does he do at Kent State?", ["quantum sensors", "medical robotics", "mechatronics", "signal and electronics", "circuits labs"]],
  ["Which countries did he work in?", ["bangladesh", "india", "nepal", "sri lanka"]],
  ["What is his GPA?", ["4.00/4.00", "3.18/4.00"]],
  ["Who advised his master's at BRAC?", ["md golam rabiul alam", "highest distinction"]],
  ["What did he work on at Medtronic?", ["field technical service specialist", "hugo", "2021", "aug 2024"]],
  ["What projects has he built?", ["multi-agent-system", "orca-draw", "passport-photo-studio", "northstar-reader"]],
  ["How can I contact him?", ["nazmul87@gmail.com", "github.com/nazmulislam-lab", "https://www.linkedin.com/in/nazmul87/", "https://wa.me/12342829758", "+1 234-282-9758", "https://nazmulislam-lab.github.io/assets/cv.pdf"]],
  ["What is his WhatsApp?", ["https://wa.me/12342829758", "+1 234-282-9758"]],
  ["What's his X?", ["https://x.com/nzml087", "nzml087"]],
  ["What is his Twitter?", ["https://x.com/nzml087", "@nzml087"]],
  ["What did he do at Philips?", ["field service engineer", "ct and pet", "2013", "2021"]],
  ["Tell me about Siemens", ["siemens bangladesh", "mri", "2012", "2013"]],
  ["What is his research on quantum sensors?", ["quantum sensors"]],
  ["What has he published?", ["scientific reports", "healthcare", "asme", "iccit", "scholar.google.com/citations?user=l6bz7joaaaaj"]],
  ["Tell me about the kidney CT paper", ["kidney cyst", "scientific reports", "doi.org/10.1038/s41598-022-15634-4"]],
  ["What is the diaphragmatic breathing paper?", ["diaphragmatic breathing", "doi.org/10.1115/dmd2025-1081"]],
  ["What languages does he use?", ["python", "matlab"]],
  ["Where is he based?", ["kent, ohio"]],
  ["Tell me about the chess project", ["online chess"]],
  ["Tell me about Chess ORCA", ["stockfish", "threat lens", "https://github.com/nazmulislam-lab/chess_orca"]],
  ["What certifications does he have?", ["o-arm imaging", "hugo ras", "workera", "deeplearning.ai"]],
  ["What is his favorite color?", ["isn't in nazmul", "public profile"]]
];

let failed = 0;
for (const [question, needles] of cases) {
  const result = answerQuestion(profile, question);
  const hay = result.text.toLowerCase();
  if (/\btodo\b/i.test(result.text)) {
    failed += 1;
    console.error("\nFAIL:", question, "contains TODO");
    console.error(result.text);
  }
  const missing = needles.filter((needle) => !hay.includes(needle.toLowerCase()));
  if (missing.length) {
    failed += 1;
    console.error("\nFAIL:", question);
    console.error("missing:", missing.join(", "));
    console.error(result.text);
  } else {
    console.log("ok:", question);
  }
}

assert.equal(profile.chat.llm.enabled, false);
assert.equal(profile.chat.llm.endpoint, "");
assert.equal(failed, 0);
console.log(`\n${cases.length} questions passed`);
