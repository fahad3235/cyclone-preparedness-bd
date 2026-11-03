/* Headless-Chrome smoke test for Cyclone Preparedness BD (raw CDP, stock headless_shell).
   Run: node tests/smoke.mjs */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + "/..";
const PAGE = "file://" + ROOT + "/index.html";
const CHROME = process.env.HOME + "/.cache/ms-playwright/chromium_headless_shell-1187/chrome-linux/headless_shell";
const PORT = 9334;

let n = 0;
function check(name, cond, extra = "") {
  n++;
  if (!cond) throw new Error("FAIL: " + name + " " + extra);
  console.log("ok " + n + " - " + name);
}

const chrome = spawn(CHROME, [
  "--headless", "--disable-gpu", "--no-sandbox",
  "--remote-debugging-port=" + PORT,
  "--user-data-dir=/tmp/cyc-smoke-profile",
  "about:blank",
], { stdio: "ignore" });

let ws;
try {
  let targets = [];
  for (let i = 0; i < 50 && targets.length === 0; i++) {
    await sleep(300);
    try {
      targets = await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json();
    } catch { /* not up yet */ }
  }
  if (!targets.length) throw new Error("CDP endpoint did not come up");
  const created = await (await fetch("http://127.0.0.1:" + PORT + "/json/new?" + new URLSearchParams({ url: PAGE }), { method: "PUT" })).json();
  ws = new WebSocket(created.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let seq = 0;
  const pending = new Map();
  const pageErrors = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
    }
    if (msg.method === "Runtime.exceptionThrown") pageErrors.push(msg.params.exceptionDetails.text || "exception");
    if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
      pageErrors.push(msg.params.args.map(a => a.value || a.description || "").join(" "));
    }
  };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const id = ++seq;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const ev = async (expr) => {
    const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("eval failed: " + JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: PAGE });
  for (let i = 0; i < 50; i++) {
    const c = await ev("document.querySelectorAll('#signalCards .sig-card').length");
    if (c === 7) break;
    await sleep(200);
  }
  check("title is Cyclone Preparedness BD", (await ev("document.title")) === "Cyclone Preparedness BD");
  check("7 signal cards render", (await ev("document.querySelectorAll('#signalCards .sig-card').length")) === 7);
  check("signal action box renders", (await ev("document.getElementById('signalAction').textContent.length")) > 50);

  // Signal picker: choose Great Danger (VIII-X) -> action mentions shelter immediately.
  await ev("(()=>{const s=document.getElementById('signalSelect');s.value='6';s.dispatchEvent(new Event('change',{bubbles:true}));})()");
  await sleep(200);
  check("picker VIII-X shows Great Danger action", (await ev("document.getElementById('signalAction').textContent")).includes("Great Danger"));

  // Checklists tab: 4 lists, 34 items total (10+7+7+10).
  await ev("document.querySelector('[data-tab=checklists]').click()");
  await sleep(200);
  check("4 checklist sections render", (await ev("document.querySelectorAll('#checklistContainer .check-list').length")) === 4);
  check("34 checklist items render", (await ev("document.querySelectorAll('#checklistContainer input[type=checkbox]').length")) === 34);
  await ev("document.querySelector('#checklistContainer input[type=checkbox]').click()");
  await sleep(200);
  check("ticking 1 item shows 3% overall", (await ev("document.getElementById('overallText').textContent")) === "3%");
  // Reload persistence: tick survives reload.
  await send("Page.reload", { ignoreCache: false });
  await sleep(800);
  for (let i = 0; i < 50; i++) {
    const c = await ev("document.querySelectorAll('#checklistContainer input[type=checkbox]:checked').length");
    if (c === 1) break;
    await sleep(200);
  }
  check("checklist tick persists after reload", (await ev("document.querySelectorAll('#checklistContainer input[type=checkbox]:checked').length")) === 1);

  // Family plan tab: empty meeting point blocks save; valid plan saves.
  await ev("document.querySelector('[data-tab=plan]').click()");
  await sleep(200);
  await ev("document.getElementById('savePlanBtn').click()");
  await sleep(200);
  check("empty meeting point shows error", (await ev("document.getElementById('planMsg').textContent.length")) > 0
    && (await ev("document.getElementById('planMsg').className")).includes("error"));
  await ev("(()=>{document.getElementById('meetingPoint').value='School field';document.getElementById('contact1Phone').value='01712345678';})()");
  await ev("document.getElementById('savePlanBtn').click()");
  await sleep(200);
  check("valid plan saves", (await ev("document.getElementById('planMsg').className")).includes("ok"));
  await send("Page.reload", { ignoreCache: false });
  await sleep(800);
  check("plan meeting point persists after reload", (await ev("document.getElementById('meetingPoint').value")) === "School field");

  // Quiz tab: start, answer via data, feedback, advance.
  await ev("document.querySelector('[data-tab=quiz]').click()");
  await sleep(200);
  await ev("document.getElementById('quizStartBtn').click()");
  await sleep(200);
  check("quiz shows Myth and Fact buttons", (await ev("document.querySelectorAll('#quizBox [data-ans]').length")) === 2);
  const quizOk = await ev(`(()=>{
    const q = document.querySelector('#quizBox .quiz-q').textContent;
    const item = window.CYC_I18N.en.quiz.find(x => x.q === q);
    if (!item) return 'no-item';
    document.querySelector('#quizBox [data-ans=' + item.answer + ']').click();
    return 'answered:' + item.answer;
  })()`);
  await sleep(200);
  check("quiz answer accepted with feedback", quizOk.startsWith("answered:") &&
    (await ev("document.querySelector('#quizBox .quiz-feedback') !== null")));
  await ev("document.getElementById('quizNextBtn').click()");
  await sleep(200);
  check("quiz advances to question 2", (await ev("document.querySelector('#quizBox .quiz-meta').textContent")).includes("2"));

  // Language toggle -> Bengali title.
  const titleBefore = await ev("document.getElementById('appTitle').textContent");
  await ev("document.getElementById('langBtn').click()");
  await sleep(300);
  const titleAfter = await ev("document.getElementById('appTitle').textContent");
  check("language toggle changes the title", titleBefore !== titleAfter);
  check("Bengali title renders", titleAfter.includes("ঘূর্ণিঝড়"));
  await ev("document.getElementById('langBtn').click()");
  await sleep(300);

  // 390px mobile: no horizontal overflow.
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(300);
  const scrollW = await ev("document.documentElement.scrollWidth");
  check("390px viewport has no horizontal overflow", scrollW <= 391, "scrollWidth=" + scrollW);

  check("zero page errors", pageErrors.length === 0, pageErrors.join(" | ").slice(0, 300));
  console.log("ALL " + n + " SMOKE CHECKS PASSED");
} finally {
  try { ws && ws.close(); } catch {}
  chrome.kill("SIGKILL");
}
