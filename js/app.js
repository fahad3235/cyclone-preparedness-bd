/* Cyclone Preparedness BD \u2014 UI. All visible text comes from CYC_I18N so the
   HTML shell stays pure ASCII; Bengali lives in i18n.js as \uXXXX escapes. */
(function () {
  var L = window.CYCLOGIC;
  var I18N = window.CYC_I18N;
  var LS_CHECKS = "cycprep-checks-v1";
  var LS_PLAN = "cycprep-plan-v1";
  var LS_BEST = "cycprep-quiz-best-v1";
  var LS_LANG = "cycprep-lang-v1";

  var lang = localStorage.getItem(LS_LANG) || "en";
  var checks = loadJSON(LS_CHECKS, {});
  var plan = loadJSON(LS_PLAN, {});
  var quizState = { started: false, idx: 0, answers: [], done: false };

  function loadJSON(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key) || "null");
      return v === null || typeof v !== "object" ? fallback : v;
    } catch (e) { return fallback; }
  }
  function saveJSON(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  function t() { return I18N[lang]; }
  function num(n) { return L.localizeDigits(n, lang); }
  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function setLang(next) {
    lang = next;
    localStorage.setItem(LS_LANG, lang);
    el("langBtn").textContent = lang === "en" ? "\u09ac\u09be\u0982\u09b2\u09be" : "English";
    document.documentElement.lang = lang === "en" ? "en" : "bn";
    renderAll();
  }

  function switchTab(name) {
    document.querySelectorAll(".tab-btn").forEach(function (b) {
      b.classList.toggle("active", b.dataset.tab === name);
    });
    document.querySelectorAll(".tab-sec").forEach(function (s) {
      s.classList.toggle("hidden", s.id !== "sec-" + name);
    });
  }

  /* ---- Signals ---- */
  function renderSignals() {
    var s = t();
    el("signalsTitle").textContent = s.signalsTitle;
    el("signalsIntro").textContent = s.signalsIntro;
    el("signalPickerLabel").textContent = s.signalPickerLabel;
    el("signalPickerHint").textContent = s.signalPickerHint;
    el("dangerNote").textContent = s.dangerNote;
    var cards = L.SIGNALS.map(function (sig) {
      var d = s.signalLevels[sig.id];
      var actions = d.actions.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("");
      return "<article class='sig-card sig-" + sig.id + "'><div class='sig-num'>" + num(sig.range) +
        "</div><div><h3>" + esc(d.name) + "</h3><p>" + esc(d.desc) + "</p><ul>" + actions + "</ul></div></article>";
    }).join("");
    el("signalCards").innerHTML = cards;
    var sel = el("signalSelect");
    if (!sel.options.length) {
      L.SIGNALS.forEach(function (sig) {
        var d = s.signalLevels[sig.id];
        var o = document.createElement("option");
        o.value = sig.id;
        o.textContent = (lang === "bn" ? "\u09b8\u0982\u0995\u09c7\u09a4 " : "Signal ") + num(sig.range) + " \u2014 " + d.name;
        sel.appendChild(o);
      });
    } else {
      Array.prototype.forEach.call(sel.options, function (o, i) {
        var d = s.signalLevels[L.SIGNALS[i].id];
        o.textContent = (lang === "bn" ? "\u09b8\u0982\u0995\u09c7\u09a4 " : "Signal ") + num(L.SIGNALS[i].range) + " \u2014 " + d.name;
      });
    }
    renderSignalAction();
  }

  function renderSignalAction() {
    var s = t();
    var id = el("signalSelect").value || "1";
    var d = s.signalLevels[id];
    var sig = L.getSignal(id);
    var actions = d.actions.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("");
    el("signalAction").innerHTML = "<h3>" + esc(d.name) + " <span class='sig-badge'>" +
      (lang === "bn" ? "\u09b8\u0982\u0995\u09c7\u09a4 " : "Signal ") + num(sig.range) + "</span></h3><p>" + esc(d.desc) +
      "</p><ul>" + actions + "</ul>";
  }

  /* ---- Checklists ---- */
  var LIST_ORDER = ["before", "during", "after", "gobag"];
  function listTitle(key) {
    var s = t();
    return { before: s.listBefore, during: s.listDuring, after: s.listAfter, gobag: s.listGobag }[key];
  }

  function renderChecklists() {
    var s = t();
    el("checklistTitle").textContent = s.checklistTitle;
    el("checklistIntro").textContent = s.checklistIntro;
    var html = "";
    var totals = {};
    LIST_ORDER.forEach(function (key) {
      var items = s.checklists[key];
      if (!Array.isArray(checks[key]) || checks[key].length !== items.length) {
        checks[key] = items.map(function () { return false; });
      }
      var done = checks[key].filter(Boolean).length;
      totals[key] = { checked: done, total: items.length };
      var rows = items.map(function (item, i) {
        var on = checks[key][i];
        return "<label class='check-row" + (on ? " done" : "") + "'><input type='checkbox' data-list='" +
          key + "' data-idx='" + i + "'" + (on ? " checked" : "") + "><span>" + esc(item) + "</span></label>";
      }).join("");
      var pct = L.checklistProgress(done, items.length);
      html += "<section class='check-list'><div class='check-head'><h3>" + esc(listTitle(key)) +
        "</h3><span class='check-meta'>" + num(done) + "/" + num(items.length) + " " + esc(s.itemsDone) +
        " \u00b7 " + num(pct) + "%</span></div><div class='bar'><div class='bar-fill' style='width:" + pct + "%'></div></div>" +
        rows + "<button class='btn ghost small' data-reset='" + key + "'>" + esc(s.resetList) + "</button></section>";
    });
    el("checklistContainer").innerHTML = html;
    var overall = L.overallProgress(totals);
    el("overallLabel").textContent = s.overallProgress;
    el("overallText").textContent = num(overall) + "%";
    el("overallBar").style.width = overall + "%";
    saveJSON(LS_CHECKS, checks);
  }

  /* ---- Family plan ---- */
  function renderPlan() {
    var s = t();
    el("planTitle").textContent = s.planTitle;
    el("planIntro").textContent = s.planIntro;
    [["meetingPoint", "meetingPoint"], ["shelter", "shelter"], ["contact1Name", "contact1Name"],
     ["contact1Phone", "contact1Phone"], ["contact2Name", "contact2Name"],
     ["contact2Phone", "contact2Phone"], ["planNotes", "planNotes"]].forEach(function (pair) {
      var label = document.querySelector("label[for='" + pair[1] + "']");
      if (label) label.textContent = s[pair[0]];
    });
    el("savePlanBtn").textContent = s.savePlan;
    el("clearPlanBtn").textContent = s.clearPlan;
    el("printPlanBtn").textContent = s.printPlan;
    ["meetingPoint", "shelter", "contact1Name", "contact1Phone", "contact2Name", "contact2Phone", "planNotes"].forEach(function (k) {
      if (plan[k] !== undefined) el(k).value = plan[k];
    });
  }

  function savePlan() {
    var s = t();
    var p = {};
    ["meetingPoint", "shelter", "contact1Name", "contact1Phone", "contact2Name", "contact2Phone", "planNotes"].forEach(function (k) {
      p[k] = el(k).value.trim();
    });
    var errors = L.validPlan(p);
    var msg = el("planMsg");
    if (errors.length) {
      msg.className = "msg error";
      msg.textContent = errors.indexOf("meetingPoint") >= 0 ? s.errMeetingPoint : s.errPhone;
      return;
    }
    plan = p;
    saveJSON(LS_PLAN, plan);
    msg.className = "msg ok";
    msg.textContent = s.planSaved;
  }

  /* ---- Quiz ---- */
  function renderQuiz() {
    var s = t();
    el("quizTitle").textContent = s.quizTitle;
    el("quizIntro").textContent = s.quizIntro;
    var box = el("quizBox");
    var best = Number(localStorage.getItem(LS_BEST) || 0);
    if (!quizState.started) {
      box.innerHTML = "<p class='quiz-best'>" + esc(s.quizBest) + ": " + num(best) + "/" + num(s.quiz.length) +
        "</p><button class='btn primary' id='quizStartBtn'>" + esc(s.quizStart) + "</button>";
      el("quizStartBtn").onclick = function () {
        quizState = { started: true, idx: 0, answers: [], done: false };
        renderQuiz();
      };
      return;
    }
    if (quizState.done) {
      var score = L.quizScore(quizState.answers, s.quiz);
      if (score > best) { best = score; localStorage.setItem(LS_BEST, String(best)); }
      box.innerHTML = "<p class='quiz-score'>" + esc(s.quizResult) + ": " + num(score) + "/" + num(s.quiz.length) +
        "</p><p class='quiz-best'>" + esc(s.quizBest) + ": " + num(best) + "/" + num(s.quiz.length) +
        "</p><button class='btn primary' id='quizRestartBtn'>" + esc(s.quizRestart) + "</button>";
      el("quizRestartBtn").onclick = function () {
        quizState = { started: true, idx: 0, answers: [], done: false };
        renderQuiz();
      };
      return;
    }
    var q = s.quiz[quizState.idx];
    var answered = quizState.answers[quizState.idx];
    var fb = "";
    if (answered) {
      var ok = answered === q.answer;
      fb = "<p class='quiz-feedback " + (ok ? "ok" : "bad") + "'>" + esc(ok ? s.quizCorrect : s.quizWrong) +
        " " + esc(q.why) + "</p>";
    }
    var btns = answered ? "" : "<button class='btn primary' data-ans='myth'>" + esc(s.quizMyth) +
      "</button> <button class='btn primary' data-ans='fact'>" + esc(s.quizFact) + "</button>";
    var next = answered ? "<button class='btn' id='quizNextBtn'>" +
      esc(quizState.idx + 1 >= s.quiz.length ? s.quizFinish : s.quizNext) + "</button>" : "";
    box.innerHTML = "<p class='quiz-meta'>" + esc(s.quizRound) + " " + num(quizState.idx + 1) + " " +
      esc(s.quizOf) + " " + num(s.quiz.length) + "</p><p class='quiz-q'>" + esc(q.q) + "</p>" + btns + fb + next;
    box.querySelectorAll("[data-ans]").forEach(function (b) {
      b.onclick = function () {
        quizState.answers[quizState.idx] = b.dataset.ans;
        renderQuiz();
      };
    });
    var nb = el("quizNextBtn");
    if (nb) nb.onclick = function () {
      if (quizState.idx + 1 >= s.quiz.length) quizState.done = true;
      else quizState.idx++;
      renderQuiz();
    };
  }

  function renderAll() {
    var s = t();
    el("appTitle").textContent = s.appTitle;
    el("tagline").textContent = s.tagline;
    el("footerText").textContent = s.footer;
    document.querySelectorAll(".tab-btn").forEach(function (b) {
      b.textContent = s[({ signals: "tabSignals", checklists: "tabChecklists", plan: "tabPlan", quiz: "tabQuiz" })[b.dataset.tab]];
    });
    renderSignals();
    renderChecklists();
    renderPlan();
    renderQuiz();
  }

  document.addEventListener("DOMContentLoaded", function () {
    el("langBtn").textContent = lang === "en" ? "\u09ac\u09be\u0982\u09b2\u09be" : "English";
    document.documentElement.lang = lang === "en" ? "en" : "bn";
    el("langBtn").onclick = function () { setLang(lang === "en" ? "bn" : "en"); };
    document.querySelectorAll(".tab-btn").forEach(function (b) {
      b.onclick = function () { switchTab(b.dataset.tab); };
    });
    el("signalSelect").onchange = renderSignalAction;
    el("checklistContainer").addEventListener("change", function (e) {
      if (e.target.matches("input[type=checkbox][data-list]")) {
        checks[e.target.dataset.list][Number(e.target.dataset.idx)] = e.target.checked;
        renderChecklists();
      }
    });
    el("checklistContainer").addEventListener("click", function (e) {
      var key = e.target.dataset && e.target.dataset.reset;
      if (key) {
        checks[key] = checks[key].map(function () { return false; });
        renderChecklists();
      }
    });
    el("savePlanBtn").onclick = savePlan;
    el("clearPlanBtn").onclick = function () {
      plan = {};
      saveJSON(LS_PLAN, plan);
      renderPlan();
      var msg = el("planMsg");
      msg.className = "msg";
      msg.textContent = t().planCleared;
    };
    el("printPlanBtn").onclick = function () { window.print(); };
    renderAll();
  });
})();
