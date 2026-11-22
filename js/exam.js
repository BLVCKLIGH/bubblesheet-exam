/* Exam flow: instructions → timed attempt → submit → result page. */
document.addEventListener("DOMContentLoaded", () => {
  const exam = EXAMS.find(e => e.id === param("id"));
  const main = $("#main");
  if (!exam) {
    main.innerHTML = `<div class="wrap"><div class="intro-card"><h1 style="font-size:2rem">Exam not found</h1><p class="muted">The link may be out of date.</p><a class="btn btn-dark" href="exams.html">See all exams</a></div></div>`;
    return;
  }
  document.title = `${exam.title} | Bubblesheet`;

  const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function newAttempt(name) {
    const picked = shuffle(exam.bank).slice(0, exam.count).map(item => {
      const order = shuffle(item.o.map((_, i) => i));
      return { q: item.q, o: order.map(i => item.o[i]), a: order.indexOf(item.a), e: item.e };
    });
    const now = Date.now();
    return { examId: exam.id, name, questions: picked, answers: Array(picked.length).fill(null), flags: Array(picked.length).fill(false), current: 0, startedAt: now, endsAt: now + exam.minutes * 60000 };
  }

  let state = null, timerId = null, warned = false;
  const saved = Store.get("inprogress", null);
  const resumable = saved && saved.examId === exam.id ? saved : null;

  /* ---------- Instructions ---------- */
  function showIntro() {
    const user = Store.get("user", null);
    const otherInProgress = saved && saved.examId !== exam.id && saved.endsAt > Date.now() ? EXAMS.find(e => e.id === saved.examId) : null;
    main.innerHTML = `<div class="wrap"><div class="intro-card">
      <p class="muted" style="margin:0">${esc(exam.subject)}</p>
      <h1 style="font-size:clamp(2rem,4.5vw,2.8rem)">${esc(exam.title)}</h1>
      <p>${esc(exam.description)}</p>
      <ul class="meta">
        <li><span>Duration</span><strong>${exam.minutes} minutes</strong></li>
        <li><span>Questions</span><strong>${exam.count}</strong></li>
        <li><span>Pass mark</span><strong>${exam.pass}%</strong></li>
        <li><span>Level</span><strong>${difficultyDots(exam.difficulty)}</strong></li>
      </ul>
      <h2 style="font-size:1.25rem">Before you start</h2>
      <ul class="rules">
        <li>Each question has one correct answer. Wrong answers don't cost marks, so answer every question.</li>
        <li>The timer starts when you press Start and keeps running if you leave the page.</li>
        <li>When time runs out, your answers are submitted automatically.</li>
        <li>Flag a question to find it quickly in the answer grid later.</li>
        <li>Keyboard: <span class="keys"><kbd>A</kbd>–<kbd>D</kbd></span> to answer, <span class="keys"><kbd>←</kbd><kbd>→</kbd></span> to move, <kbd>F</kbd> to flag.</li>
      </ul>
      ${otherInProgress ? `<p class="error">You have an unfinished ${esc(otherInProgress.title)} exam. Starting this one will discard it.</p>` : ""}
      <form id="start-form" novalidate>
        <div class="field"><label for="name">Your name, for the leaderboard</label><input id="name" autocomplete="name" value="${user ? esc(user.name) : ""}" maxlength="40"><span class="error" id="name-err"></span></div>
        <div style="display:flex;gap:.75rem;flex-wrap:wrap">
          ${resumable && resumable.endsAt > Date.now() ? `<button class="btn btn-guide" type="button" id="resume">Resume your attempt (${mmss((resumable.endsAt - Date.now()) / 1000)} left)</button>` : ""}
          <button class="btn btn-dark" type="submit">${resumable && resumable.endsAt > Date.now() ? "Start over" : "Start exam"}</button>
          <a class="btn btn-line" href="exams.html">Back to exams</a>
        </div>
      </form>
    </div></div>`;
    $("#start-form").addEventListener("submit", e => {
      e.preventDefault();
      const name = $("#name").value.trim();
      if (name.length < 2) { $("#name-err").textContent = "Enter your name (at least 2 letters)."; $("#name").focus(); return; }
      Store.set("user", { name });
      state = newAttempt(name);
      save(); run();
    });
    const r = $("#resume");
    if (r) r.addEventListener("click", () => { state = resumable; run(); });
  }

  const save = () => Store.set("inprogress", state);

  /* ---------- Attempt ---------- */
  function run() {
    const hdr = $(".site-header"); if (hdr) hdr.remove(); // fewer distractions during the exam
    main.innerHTML = `
      <div class="exam-bar">
        <div class="wrap">
          <h1>${esc(exam.title)}</h1>
          <span class="progress-text" id="progress-text"></span>
          <div class="timer" id="timer" role="timer" aria-label="Time remaining">${ICON.clock}<span id="time"></span></div>
        </div>
        <div class="progress"><span id="bar"></span></div>
      </div>
      <div class="wrap exam-layout">
        <div class="q-card" id="q-card" aria-live="polite"></div>
        <aside class="palette-box" aria-label="Answer grid">
          <h2>Answer grid</h2>
          <div class="palette" id="palette"></div>
          <ul class="legend">
            <li><span class="bubble filled"></span> Answered</li>
            <li><span class="bubble"></span> Not answered</li>
            <li><span class="dotflag"></span> Flagged for review</li>
          </ul>
          <button class="btn btn-guide" style="width:100%" type="button" id="finish">Submit exam</button>
        </aside>
      </div>`;
    $("#palette").addEventListener("click", e => { const b = e.target.closest("button"); if (b) go(Number(b.dataset.i)); });
    $("#finish").addEventListener("click", askSubmit);
    window.addEventListener("beforeunload", guard);
    document.addEventListener("keydown", keys);
    draw();
    tick();
    timerId = setInterval(tick, 250);
  }

  function guard(e) { if (state) { e.preventDefault(); e.returnValue = ""; } }

  function draw() {
    const i = state.current, item = state.questions[i], n = state.questions.length;
    const answered = state.answers.filter(a => a !== null).length;
    $("#q-card").innerHTML = `
      <div class="q-num"><span class="bubble filled">${i + 1}</span><span>Question ${i + 1} of ${n}</span></div>
      <p class="q-text" id="q-text">${rich(item.q)}</p>
      <ul class="options" role="radiogroup" aria-labelledby="q-text">
        ${item.o.map((opt, j) => `<li><button class="opt" type="button" role="radio" aria-checked="${state.answers[i] === j}" data-j="${j}"><span class="bubble">${LETTERS[j]}</span><span>${rich(opt)}</span></button></li>`).join("")}
      </ul>
      <div class="q-actions">
        <button class="btn btn-line btn-small" type="button" id="prev" ${i === 0 ? "disabled" : ""}>Previous</button>
        <button class="btn btn-line btn-small flag-btn" type="button" id="flag" aria-pressed="${state.flags[i]}">${state.flags[i] ? "Flagged" : "Flag for review"}</button>
        ${state.answers[i] !== null ? `<button class="btn btn-line btn-small" type="button" id="clear">Clear answer</button>` : ""}
        <span class="spacer"></span>
        ${i < n - 1 ? `<button class="btn btn-dark btn-small" type="button" id="next">Next question</button>` : `<button class="btn btn-guide btn-small" type="button" id="last-submit">Submit exam</button>`}
      </div>`;
    $$(".opt").forEach(b => b.addEventListener("click", () => choose(Number(b.dataset.j))));
    $("#prev").addEventListener("click", () => go(i - 1));
    $("#flag").addEventListener("click", toggleFlag);
    const nx = $("#next"); if (nx) nx.addEventListener("click", () => go(i + 1));
    const ls = $("#last-submit"); if (ls) ls.addEventListener("click", askSubmit);
    const cl = $("#clear"); if (cl) cl.addEventListener("click", () => { state.answers[i] = null; save(); draw(); });

    $("#palette").innerHTML = state.questions.map((_, k) => {
      const cls = [state.answers[k] !== null ? "answered" : "", state.flags[k] ? "flagged" : ""].join(" ").trim();
      const label = `Question ${k + 1}, ${state.answers[k] !== null ? "answered" : "not answered"}${state.flags[k] ? ", flagged" : ""}`;
      return `<button type="button" class="${cls}" data-i="${k}" aria-label="${label}"${k === i ? ' aria-current="true"' : ""}>${k + 1}</button>`;
    }).join("");
    $("#progress-text").textContent = `${answered} of ${n} answered`;
    $("#bar").style.width = (answered / n) * 100 + "%";
  }

  function choose(j) { state.answers[state.current] = j; save(); draw(); const sel = $(`.opt[data-j="${j}"]`); if (sel) sel.focus(); }
  function go(i) { if (i < 0 || i >= state.questions.length) return; state.current = i; save(); draw(); $("#q-card").scrollIntoView({ block: "nearest" }); }
  function toggleFlag() { state.flags[state.current] = !state.flags[state.current]; save(); draw(); }

  function keys(e) {
    if (!state || $("#submit-modal").classList.contains("open") || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    const k = e.key.toUpperCase(), n = state.questions[state.current].o.length;
    const idx = LETTERS.indexOf(k) >= 0 ? LETTERS.indexOf(k) : ["1", "2", "3", "4", "5"].indexOf(k);
    if (idx >= 0 && idx < n && !e.ctrlKey && !e.metaKey) { choose(idx); e.preventDefault(); }
    else if (e.key === "ArrowRight") go(state.current + 1);
    else if (e.key === "ArrowLeft") go(state.current - 1);
    else if (k === "F" && !e.ctrlKey && !e.metaKey) toggleFlag();
  }

  function tick() {
    const left = Math.max(0, Math.round((state.endsAt - Date.now()) / 1000));
    $("#time").textContent = mmss(left);
    const total = exam.minutes * 60;
    const t = $("#timer");
    t.classList.toggle("critical", left <= 60);
    t.classList.toggle("low", left > 60 && left <= Math.max(120, total * 0.2));
    t.setAttribute("aria-label", `${Math.floor(left / 60)} minutes ${left % 60} seconds remaining`);
    if (left <= 60 && !warned && left > 0) { warned = true; toast("One minute left. Your answers are submitted automatically at 00:00."); }
    if (left === 0) finish(true);
  }

  function askSubmit() {
    const n = state.questions.length;
    const unanswered = state.answers.filter(a => a === null).length, flagged = state.flags.filter(Boolean).length;
    $("#submit-text").innerHTML = unanswered
      ? `You haven't answered <strong>${unanswered} of ${n}</strong> questions${flagged ? ` and have <strong>${flagged}</strong> flagged` : ""}. Unanswered questions score zero.`
      : flagged ? `All questions are answered, but <strong>${flagged}</strong> ${flagged === 1 ? "is" : "are"} still flagged for review.` : "All questions are answered. You can't change your answers after submitting.";
    $("#submit-modal").classList.add("open");
    $("#submit-cancel").focus();
  }
  $("#submit-cancel").addEventListener("click", () => $("#submit-modal").classList.remove("open"));
  $("#submit-confirm").addEventListener("click", () => finish(false));
  document.addEventListener("keydown", e => { if (e.key === "Escape") $("#submit-modal").classList.remove("open"); });

  function finish(timedOut) {
    if (!state) return;
    clearInterval(timerId);
    const correct = state.questions.reduce((s, q, i) => s + (state.answers[i] === q.a ? 1 : 0), 0);
    const n = state.questions.length, pct = Math.round((correct / n) * 100);
    const attempt = {
      id: Date.now().toString(36), examId: exam.id, title: exam.title, name: state.name,
      questions: state.questions, answers: state.answers, correct, total: n, pct, passed: pct >= exam.pass,
      secs: Math.min(exam.minutes * 60, Math.round((Math.min(Date.now(), state.endsAt) - state.startedAt) / 1000)), timedOut, finishedAt: new Date().toISOString(),
    };
    Store.set("attempts", [attempt, ...attempts()].slice(0, 100));
    Store.del("inprogress");
    state = null;
    window.removeEventListener("beforeunload", guard);
    location.href = "result.html?attempt=" + attempt.id;
  }

  // An attempt that ran out of time while the page was closed is submitted straight away
  if (resumable && resumable.endsAt <= Date.now()) { state = resumable; finish(true); return; }
  showIntro();
});
