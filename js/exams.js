document.addEventListener("DOMContentLoaded", () => {
  $("#subject").innerHTML += SUBJECTS.map(s => `<option>${s}</option>`).join("");
  $("#level").innerHTML += DIFFICULTIES.map(d => `<option>${d}</option>`).join("");
  if (param("level")) $("#level").value = param("level");
  if (param("subject")) $("#subject").value = param("subject");

  function apply() {
    const q = $("#q").value.trim().toLowerCase(), s = $("#subject").value, l = $("#level").value, st = $("#status").value;
    const list = EXAMS.filter(e =>
      (!q || (e.title + " " + e.subject + " " + e.description).toLowerCase().includes(q)) &&
      (!s || e.subject === s) && (!l || e.difficulty === l) &&
      (!st || (st === "done" ? bestFor(e.id) >= 0 : bestFor(e.id) < 0)));
    $("#count").textContent = `${list.length} of ${EXAMS.length} exams`;
    $("#grid").innerHTML = list.length ? list.map(examCard).join("")
      : `<div class="empty"><h3>No exams match</h3><p class="muted">Try a different subject or level.</p><button class="btn btn-dark" id="clear" type="button">Clear filters</button></div>`;
    const c = $("#clear");
    if (c) c.addEventListener("click", () => { $("#q").value = ""; $("#subject").value = ""; $("#level").value = ""; $("#status").value = ""; apply(); });
  }
  $("#filters").addEventListener("input", apply);
  apply();
});
