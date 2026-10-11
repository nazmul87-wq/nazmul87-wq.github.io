import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { answerQuestion } from "../js/retrieve.js";

const profile = JSON.parse(readFileSync(new URL("../data/profile.json", import.meta.url), "utf8"));

const cases = [
  ["Where does he study?", ["kent state", "phd"]],
  ["What did he work on at Medtronic?", ["medtronic", "hugo", "imaging"]],
  ["What projects has he built?", ["multi-agent-system", "orca-draw", "passport-photo-studio", "northstar-reader", "online chess"]],
  ["How can I contact him?", ["nazmul87@gmail.com", "github.com/nazmul87-wq", "linkedin.com/in/nazmul87"]],
  ["What did he do at Philips?", ["philips", "imaging"]],
  ["Tell me about Siemens", ["siemens"]],
  ["What is his research on quantum sensors?", ["quantum", "opm"]],
  ["What has he published?", ["scientific reports", "healthcare"]],
  ["What languages does he use?", ["python", "matlab"]],
  ["Where is he based?", ["kent, ohio"]],
  ["Tell me about the chess project", ["online chess", "todo"]],
  ["What is his favorite color?", ["don’t have that", "public profile"]]
];

let failed = 0;
for (const [question, needles] of cases) {
  const result = answerQuestion(profile, question);
  const hay = result.text.toLowerCase();
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
