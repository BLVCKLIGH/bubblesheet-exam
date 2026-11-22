document.addEventListener("DOMContentLoaded", () => {
  const main = $("#main");
  const a = attempts().find(x => x.id === param("attempt")) || (param("attempt") ? null : attempts()[0]);
  if (!a) {
    main.innerHTML = `<div class="page-head"><h1>Result not found</h1><p>Results are saved in the browser you took the exam in.</p></div><p><a class="btn btn-dark" href="exams.html">Take an exam</a></p>`;
    return;
  }
  const exam = EXAMS.find(e => e.id === a.examId) || { pass: 50, title: a.title, id: a.examId };
  const wrong = a.answers.filter((x, i) => x !== null && x !== a.questions[i].a).length;
  const skipped = a.answers.filter(x => x === null).length;
  const previous = attempts().filter(x => x.examId === a.examId && x.id !== a.id && x.finishedAt < a.finishedAt);
  const prevBest = previous.reduce((m, x) => Math.max(m, x.pct), -1);
  document.title = `${a.pct}% in ${a.title} | Bubblesheet`;

  main.innerHTML = `
    <div class="result-top">
      <div class="ring" style="--p:${a.pct};--ring:var(${a.passed ? "--ok" : "--bad"})" role="img" aria-label="Score ${a.pct} percent"><div><div><strong>${a.pct}%</strong><br><span class="muted">${a.correct} / ${a.total}</span></div></div></div>
      <div>
        <span class="verdict ${a.passed ? "pass" : "fail"}">${a.passed ? "Passed" : "Not passed"}</span>
        <h1 style="font-size:clamp(2rem,4.5vw,3rem)">${esc(a.title)}</h1>
        <p class="muted" style="margin:0">${a.passed ? `Well done, ${esc(a.name)}. The pass mark is ${exam.pass}%.` : `${esc(a.name)}, you needed ${exam.pass}% to pass. Review the answers below and try again.`}
          ${a.timedOut ? " Time ran out, so your answers were submitted automatically." : ""}
          ${prevBest >= 0 ? (a.pct > prevBest ? ` That's up from your previous best of ${prevBest}%.` : ` Your best so far is ${Math.max(prevBest, a.pct)}%.`) : ""}</p>
        <div class="tally">
          <div><strong style="color:var(--ok)">${a.correct}</strong><span>Correct</span></div>
          <div><strong style="color:var(--bad)">${wrong}</strong><span>Wrong</span></div>
          <div><strong style="color:var(--warn)">${skipped}</strong><span>Not answered</span></div>
          <div><strong>${mmss(a.secs)}</strong><span>Time taken</span></div>
        </div>
        <div style="display:flex;gap:.75rem;flex-wrap:wrap">
          <a class="btn btn-dark" href="exam.html?id=${exam.id}">Try again with new questions</a>
          <a class="btn btn-line" href="history.html">All my results</a>
          <button class="btn btn-line" type="button" onclick="window.print()">Print</button>
        </div>
      </div>
    </div>
    <h2>Answer review</h2>
    <div class="seg" role="group" aria-label="Show questions">
      <button type="button" data-f="all" aria-pressed="true">All (${a.total})</button>
      <button type="button" data-f="wrong" aria-pressed="false">Wrong or skipped (${wrong + skipped})</button>
      <button type="button" data-f="right" aria-pressed="false">Correct (${a.correct})</button>
    </div>
    <ol class="review" id="review"></ol>`;

  function drawReview(filter) {
    $("#review").innerHTML = a.questions.map((q, i) => {
      const mine = a.answers[i], status = mine === null ? "skipped" : mine === q.a ? "right" : "wrong";
      if (filter === "wrong" && status === "right") return "";
      if (filter === "right" && status !== "right") return "";
      const label = { right: "Correct", wrong: "Wrong", skipped: "Not answered" }[status];
      return `<li class="${status}">
        <div class="rq">${i + 1}. ${rich(q.q)} <span class="tag ${status}">${label}</span></div>
        <div class="ans"><b>Your answer</b><span>${mine === null ? "<em class='muted'>No answer</em>" : `${LETTERS[mine]}. ${rich(q.o[mine])}`}</span></div>
        ${status !== "right" ? `<div class="ans"><b>Correct answer</b><span>${LETTERS[q.a]}. ${rich(q.o[q.a])}</span></div>` : ""}
        <p class="exp">${rich(q.e)}</p>
      </li>`;
    }).join("") || `<li>No questions in this group.</li>`;
  }
  $(".seg").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $$(".seg button").forEach(x => x.setAttribute("aria-pressed", x === b));
    drawReview(b.dataset.f);
  });
  drawReview("all");
});
