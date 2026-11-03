/* Node unit tests for Cyclone Preparedness BD logic. Run: node tests/unit.test.js */
const assert = require("node:assert");
const L = require("../js/logic.js");

let n = 0;
function check(name, cond) {
  n++;
  assert.ok(cond, "FAIL: " + name);
  console.log("ok " + n + " - " + name);
}

// Bengali digits
check("toBnDigits converts 2026", L.toBnDigits("2026") === "২০২৬");
check("toBnDigits converts 999", L.toBnDigits("999") === "৯৯৯");
check("localizeDigits keeps EN digits in en", L.localizeDigits("42", "en") === "42");
check("localizeDigits converts in bn", L.localizeDigits("42", "bn") === "৪২");

// Signals
check("7 signals defined", L.SIGNALS.length === 7);
check("getSignal 5 is V-VII", L.getSignal("5").range === "V-VII");
check("getSignal 6 is VIII-X", L.getSignal("6").range === "VIII-X");
check("getSignal 7 is XI", L.getSignal("7").range === "XI");
check("getSignal unknown returns null", L.getSignal("99") === null);

// Checklist progress
check("progress 3/10 = 30", L.checklistProgress(3, 10) === 30);
check("progress 0/7 = 0", L.checklistProgress(0, 7) === 0);
check("progress 7/7 = 100", L.checklistProgress(7, 7) === 100);
check("progress with 0 total = 0", L.checklistProgress(0, 0) === 0);
check("overall progress across lists", L.overallProgress({
  before: { checked: 5, total: 10 },
  during: { checked: 7, total: 7 },
  after: { checked: 0, total: 7 },
  gobag: { checked: 10, total: 10 }
}) === 65); // 22/34 = 64.7 -> 65

// Phone validation
check("empty phone is valid (optional)", L.validPhone("") === true);
check("BD mobile 01712345678 valid", L.validPhone("01712345678") === true);
check("+880 number valid", L.validPhone("+8801712345678") === true);
check("too short rejected", L.validPhone("12345") === false);
check("letters rejected", L.validPhone("01712abc678") === false);
check("too long rejected", L.validPhone("01234567890123456") === false);

// Plan validation
check("plan without meeting point errors", L.validPlan({ meetingPoint: "", contact1Phone: "" }).includes("meetingPoint"));
check("plan with bad phone errors", L.validPlan({ meetingPoint: "School field", contact1Phone: "abc" }).includes("contact1Phone"));
check("valid plan has no errors", L.validPlan({ meetingPoint: "School field", contact1Phone: "01712345678" }).length === 0);

// Quiz scoring
const quiz = [{ answer: "myth" }, { answer: "fact" }, { answer: "myth" }];
check("quiz score 2/3", L.quizScore(["myth", "fact", "fact"], quiz) === 2);
check("quiz score 0/3", L.quizScore(["fact", "myth", "fact"], quiz) === 0);

console.log("ALL " + n + " UNIT CHECKS PASSED");
