document.addEventListener("DOMContentLoaded", () => {
  // Answer sheet that fills itself in, once, on load
  const rows = [[1, 0, true], [2, 2, true], [3, 1, true], [4, 3, false], [5, 0, true], [6, 2, true], [7, 1, true], [8, 3, true]];
  $("#sheet").innerHTML = `<div class="sheet-head"><span>Answer sheet</span><span>Practice exam 04</span></div><div class="sheet-row" style="height:30px"><span></span>${LETTERS.slice(0, 4).map(l => `<span class="n" style="text-align:center">${l}</span>`).join("")}<span></span></div>` +
    rows.map(([n, pick, ok], i) => `<div class="sheet-row"><span class="n">${n}</span>${[0, 1, 2, 3].map(j =>
      `<span class="bubble${j === pick ? " fill-in" : ""}" style="${j === pick ? `animation-delay:${0.3 + i * 0.36}s` : ""}">${LETTERS[j]}</span>`).join("")}
      <span class="mark ${ok ? "ok" : "no"}" style="animation-delay:${0.55 + i * 0.36}s">${ok ? "✓" : "✗"}</span></div>`).join("") +
    `<div class="sheet-score"><span class="muted">Score</span><strong>7 / 8</strong></div>`;

  const done = attempts();
  $("#exam-summary").textContent = done.length
    ? `${EXAMS.length} exams. You've completed ${done.length} ${done.length === 1 ? "attempt" : "attempts"} so far.`
    : `${EXAMS.length} exams across ${SUBJECTS.length} subjects.`;
  $("#exam-grid").innerHTML = EXAMS.map(examCard).join("");
});
