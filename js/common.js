/* Shared helpers for Bubblesheet. */
const Store = {
  get(k, d) { try { const v = localStorage.getItem("bubblesheet:" + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("bubblesheet:" + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  del(k) { try { localStorage.removeItem("bubblesheet:" + k); } catch { /* ignore */ } },
};
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
/* Escape, then turn `backticks` into <code> */
const rich = s => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
const param = n => new URLSearchParams(location.search).get(n);
const LETTERS = ["A", "B", "C", "D", "E"];
const mmss = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const durationText = s => s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${s % 60 ? (s % 60) + " s" : ""}`.trim();
const attempts = () => Store.get("attempts", []);
const bestFor = id => attempts().filter(a => a.examId === id).reduce((m, a) => Math.max(m, a.pct), -1);

const ICON = {
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg>',
};
const LOGO = '<span class="logo-mark" aria-hidden="true"><i></i><i class="f"></i><i></i><i></i></span>';

(function () {
  const t = Store.get("theme", null);
  document.documentElement.dataset.theme = t || (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
})();

function difficultyDots(d) {
  const n = DIFFICULTIES.indexOf(d) + 1;
  return `<span class="diff" aria-label="${d}">${[1, 2, 3].map(i => `<i class="${i <= n ? "on" : ""}"></i>`).join("")} ${d}</span>`;
}

function examCard(e) {
  const best = bestFor(e.id);
  return `<article class="exam-card">
    <span class="subject">${esc(e.subject)}</span>
    <h3>${esc(e.title)}</h3>
    <p>${esc(e.description)}</p>
    <ul class="meta">
      <li><span>Duration</span><strong>${e.minutes} min</strong></li>
      <li><span>Questions</span><strong>${e.count}</strong></li>
      <li><span>Level</span><strong>${difficultyDots(e.difficulty)}</strong></li>
    </ul>
    <div class="foot">
      <span class="best">${best >= 0 ? `Your best: <strong>${best}%</strong>` : `Pass mark ${e.pass}%`}</span>
      <a class="btn btn-dark btn-small" href="exam.html?id=${e.id}">${best >= 0 ? "Try again" : "Start exam"}</a>
    </div>
  </article>`;
}

function renderChrome() {
  const page = document.body.dataset.page;
  const user = Store.get("user", null);
  const dark = document.documentElement.dataset.theme === "dark";
  const links = [["index.html", "Home", "home"], ["exams.html", "Exams", "exams"], ["history.html", "My results", "history"], ["history.html#leaderboard", "Leaderboard", "board"]];
  const h = $("#site-header");
  if (h) h.outerHTML = `<header class="site-header"><a class="skip" href="#main">Skip to content</a>
    <nav class="nav wrap" aria-label="Main">
      <a class="logo" href="index.html">${LOGO}Bubblesheet</a>
      <ul class="nav-links" id="nav-links">${links.map(([href, t, k]) => `<li><a href="${href}"${k === page ? ' aria-current="page"' : ""}>${t}</a></li>`).join("")}</ul>
      <div class="nav-actions">
        ${user ? `<span class="who" title="Signed in">${esc(user.name)}</span>` : ""}
        <button class="icon-btn" id="theme-btn" type="button" aria-label="${dark ? "Switch to light mode" : "Switch to dark mode"}">${dark ? ICON.sun : ICON.moon}</button>
        <button class="icon-btn menu-btn" id="menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links">${ICON.menu}</button>
      </div>
    </nav></header>`;
  const f = $("#site-footer");
  if (f) f.outerHTML = `<footer class="site-footer"><div class="wrap footer-grid">
      <div><a class="logo" href="index.html">${LOGO}Bubblesheet</a><p class="muted" style="margin-top:.75rem">Timed practice exams that mark themselves. Built for students, teachers and anyone preparing for a test.</p></div>
      <div><h3>Practise</h3><ul><li><a href="exams.html">All exams</a></li><li><a href="exams.html?level=Easy">Easy exams</a></li><li><a href="exams.html?level=Hard">Hard exams</a></li></ul></div>
      <div><h3>Your progress</h3><ul><li><a href="history.html">My results</a></li><li><a href="history.html#leaderboard">Leaderboard</a></li></ul></div>
      <div><h3>About</h3><ul><li><a href="index.html#how">How it works</a></li><li><a href="mailto:hello@bubblesheet.co.za">Contact us</a></li><li><a href="mailto:schools@bubblesheet.co.za">For schools</a></li></ul></div>
    </div><div class="wrap footer-bottom"><span>© ${new Date().getFullYear()} Bubblesheet. A demo project.</span><span>Results are saved in this browser only.</span></div></footer>`;
  const tb = $("#theme-btn");
  if (tb) tb.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next; Store.set("theme", next);
    tb.innerHTML = next === "dark" ? ICON.sun : ICON.moon;
    tb.setAttribute("aria-label", next === "dark" ? "Switch to light mode" : "Switch to dark mode");
  });
  const mb = $("#menu-btn");
  if (mb) mb.addEventListener("click", e => { const o = $("#nav-links").classList.toggle("open"); e.currentTarget.setAttribute("aria-expanded", o); });
}

function toast(msg) {
  let t = $(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 3000);
}

document.addEventListener("DOMContentLoaded", renderChrome);
