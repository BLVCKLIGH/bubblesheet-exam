document.addEventListener("DOMContentLoaded", () => {
  const user = Store.get("user", null);

  function drawHistory() {
    const list = attempts();
    if (!list.length) {
      $("#summary").textContent = "You haven't taken an exam yet.";
      $("#history").innerHTML = `<div class="empty" style="margin-bottom:3rem"><h3>No results yet</h3><p class="muted">Your scores and answer reviews will appear here after your first exam.</p><a class="btn btn-dark" href="exams.html">Choose an exam</a></div>`;
      return;
    }
    const passes = list.filter(a => a.passed).length;
    const avg = Math.round(list.reduce((s, a) => s + a.pct, 0) / list.length);
    $("#summary").textContent = `${list.length} ${list.length === 1 ? "attempt" : "attempts"}, ${passes} passed, average score ${avg}%.`;
    $("#history").innerHTML = `<div class="table-wrap"><table class="data">
      <thead><tr><th scope="col">Date</th><th scope="col">Exam</th><th scope="col" class="num">Score</th><th scope="col">Result</th><th scope="col" class="num">Time</th><th scope="col"><span class="sr-only">Review</span></th></tr></thead>
      <tbody>${list.map(a => `<tr>
        <td>${new Date(a.finishedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}, ${new Date(a.finishedAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}</td>
        <td>${esc(a.title)}</td>
        <td class="num"><strong>${a.pct}%</strong> <span class="muted">(${a.correct}/${a.total})</span></td>
        <td><span class="tag ${a.passed ? "right" : "wrong"}" style="margin:0">${a.passed ? "Passed" : "Not passed"}</span></td>
        <td class="num">${mmss(a.secs)}</td>
        <td><a href="result.html?attempt=${a.id}">Review answers</a></td></tr>`).join("")}</tbody></table></div>
      <p style="margin:-2rem 0 3rem"><button class="btn btn-line btn-small" type="button" id="clear">Delete all my results</button></p>`;
    $("#clear").addEventListener("click", () => {
      if ($("#clear").dataset.confirm) { Store.set("attempts", []); drawHistory(); drawBoard(); toast("All results deleted."); }
      else { $("#clear").dataset.confirm = "1"; $("#clear").textContent = "Click again to delete all results"; }
    });
  }

  $("#board-exam").innerHTML = EXAMS.map(e => `<option value="${e.id}">${esc(e.title)}</option>`).join("");
  const lastExam = attempts()[0];
  if (lastExam) $("#board-exam").value = lastExam.examId;

  function drawBoard() {
    const id = $("#board-exam").value;
    const best = {};
    SAMPLE_SCORES.filter(s => s.exam === id).forEach(s => { best[s.name] = { name: s.name, pct: s.pct, secs: s.secs, sample: true }; });
    attempts().filter(a => a.examId === id).forEach(a => {
      const cur = best[a.name];
      if (!cur || a.pct > cur.pct || (a.pct === cur.pct && a.secs < cur.secs)) best[a.name] = { name: a.name, pct: a.pct, secs: a.secs, sample: false };
    });
    const rows = Object.values(best).sort((x, y) => y.pct - x.pct || x.secs - y.secs);
    $("#board").innerHTML = rows.map((r, i) => `<tr${user && r.name === user.name && !r.sample ? ' class="you"' : ""}>
      <td class="rank">${i + 1}</td>
      <td>${esc(r.name)}${user && r.name === user.name && !r.sample ? " (you)" : ""}${r.sample ? '<span class="sample">sample score</span>' : ""}</td>
      <td class="num">${r.pct}%</td><td class="num">${mmss(r.secs)}</td></tr>`).join("");
  }
  $("#board-exam").addEventListener("change", drawBoard);
  drawHistory(); drawBoard();
});
