/* Pure logic for Cyclone Preparedness BD. UMD: works in browser and node tests. */
(function (root) {
  var BN_DIGITS = ["\u09e6", "\u09e7", "\u09e8", "\u09e9", "\u09ea", "\u09eb", "\u09ec", "\u09ed", "\u09ee", "\u09ef"];

  function toBnDigits(str) {
    return String(str).replace(/[0-9]/g, function (d) { return BN_DIGITS[Number(d)]; });
  }

  function localizeDigits(str, lang) {
    return lang === "bn" ? toBnDigits(str) : String(str);
  }

  // Maritime-port cyclone warning signals (Bangladesh Meteorological Department).
  var SIGNALS = [
    { id: "1", range: "I" },
    { id: "2", range: "II" },
    { id: "3", range: "III" },
    { id: "4", range: "IV" },
    { id: "5", range: "V-VII" },
    { id: "6", range: "VIII-X" },
    { id: "7", range: "XI" }
  ];

  function getSignal(id) {
    for (var i = 0; i < SIGNALS.length; i++) {
      if (SIGNALS[i].id === String(id)) return SIGNALS[i];
    }
    return null;
  }

  function checklistProgress(checked, total) {
    if (!total || total <= 0) return 0;
    return Math.round((checked / total) * 100);
  }

  function overallProgress(lists) {
    var checked = 0, total = 0;
    Object.keys(lists).forEach(function (k) {
      checked += lists[k].checked;
      total += lists[k].total;
    });
    return checklistProgress(checked, total);
  }

  // Phone numbers: digits, spaces, +, -, parentheses; 7-15 digits.
  function validPhone(phone) {
    if (phone === "" || phone === null || phone === undefined) return true;
    var digits = String(phone).replace(/[^0-9]/g, "");
    return digits.length >= 7 && digits.length <= 15 && /^[+0-9][0-9 ()-]*$/.test(String(phone).trim());
  }

  function validPlan(plan) {
    var errors = [];
    if (!plan.meetingPoint || !plan.meetingPoint.trim()) errors.push("meetingPoint");
    if (!validPhone(plan.contact1Phone || "")) errors.push("contact1Phone");
    if (!validPhone(plan.contact2Phone || "")) errors.push("contact2Phone");
    return errors;
  }

  function quizScore(answers, quiz) {
    var score = 0;
    quiz.forEach(function (q, i) {
      if (answers[i] === q.answer) score++;
    });
    return score;
  }

  var api = {
    toBnDigits: toBnDigits,
    localizeDigits: localizeDigits,
    SIGNALS: SIGNALS,
    getSignal: getSignal,
    checklistProgress: checklistProgress,
    overallProgress: overallProgress,
    validPhone: validPhone,
    validPlan: validPlan,
    quizScore: quizScore
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.CYCLOGIC = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
