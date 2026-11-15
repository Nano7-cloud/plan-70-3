(() => {
  const SPORT = {
    swim: "Natación",
    bike: "Bici",
    run: "Carrera",
    gym: "Gimnasio",
    rest: "Descanso",
  };
  const DAY_MS = 86400000;
  const $ = (id) => document.getElementById(id);

  let plan = null;
  let current = 0; // index of week shown
  let todayIdx = 0; // index of the week containing today

  // Dates are handled as local calendar days to avoid timezone drift.
  const parseDate = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const todayDate = () => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const sameDay = (a, b) => a.getTime() === b.getTime();
  const fmt = (d, opts) => d.toLocaleDateString("es-ES", opts);
  const shortDate = (d) => fmt(d, { day: "numeric", month: "short" }).replace(".", "");
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const slug = (s) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(" ")[0];
  const hours = (h) => `≈${String(h).replace(".", ",")} h`;

  function phasePill(phase) {
    return `<span class="phase-pill ${slug(phase)}">${esc(phase)}</span>`;
  }

  function renderHeader() {
    const race = parseDate(plan.race.date);
    const today = todayDate();
    const days = Math.max(0, Math.round((race - today) / DAY_MS));
    $("race-name").textContent = plan.race.name;
    $("race-date").textContent = fmt(race, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    $("race-distances").textContent = plan.race.distances;
    $("days-left").textContent = days;
    const start = parseDate(plan.weeks[0].start);
    if (today < start) {
      $("week-now").textContent = "–";
      $("phase-now").textContent = "Empieza el " + shortDate(start);
    } else {
      $("week-now").textContent = `${todayIdx + 1}/${plan.weeks.length}`;
      $("phase-now").textContent = plan.weeks[todayIdx].phase;
    }
    const upd = parseDate(plan.updated);
    $("updated").textContent = "Plan actualizado el " + fmt(upd, { day: "numeric", month: "long", year: "numeric" });
  }

  function renderWeek() {
    const w = plan.weeks[current];
    const start = parseDate(w.start);
    const end = addDays(start, 6);
    const today = todayDate();

    $("week-label").textContent = `Semana ${w.n}`;
    $("week-dates").textContent = `${shortDate(start)} – ${shortDate(end)}`;
    $("prev-week").disabled = current === 0;
    $("next-week").disabled = current === plan.weeks.length - 1;

    $("week-summary").innerHTML = `
      ${phasePill(w.phase)}
      <div class="summary-grid">
        <div><small>Volumen</small><b>${hours(w.hours)}</b></div>
        <div><small>Natación</small><b>${esc(w.swim)}</b></div>
        <div><small>Bici larga</small><b>${esc(w.longRide)}</b></div>
        <div><small>Carrera larga</small><b>${esc(w.longRun)}</b></div>
      </div>
      <p class="key">${esc(w.key)}</p>`;

    if (!w.days) {
      $("week-days").innerHTML = `<div class="pending">El detalle de esta semana se publica unos días antes, según cómo vayan las anteriores.</div>`;
      return;
    }

    $("week-days").innerHTML = w.days
      .map((day, i) => {
        const date = addDays(start, i);
        const isToday = sameDay(date, today);
        const isPast = date < today;
        const sessions = day.sessions
          .map(
            (s) => `
          <div class="session ${esc(s.sport)}">
            <div class="bar"></div>
            <div>
              <div class="sport">${SPORT[s.sport] || esc(s.sport)}${s.test ? '<span class="test-tag">TEST</span>' : ""}</div>
              <div class="title">${esc(s.title)}</div>
              ${s.detail ? `<div class="detail">${esc(s.detail)}</div>` : ""}
            </div>
          </div>`
          )
          .join("");
        return `
        <article class="day${isToday ? " today" : ""}${isPast ? " past" : ""}" ${isToday ? 'id="today"' : ""}>
          <div class="day-head">
            <b>${fmt(date, { weekday: "long" })}</b>
            <span class="${isToday ? "today-tag" : ""}">${isToday ? "Hoy" : shortDate(date)}</span>
          </div>
          ${sessions}
        </article>`;
      })
      .join("");
  }

  function renderPlan() {
    const max = Math.max(...plan.weeks.map((w) => w.hours));
    $("plan-list").innerHTML = plan.weeks
      .map((w, i) => {
        const start = parseDate(w.start);
        return `
        <button class="plan-row${i === todayIdx ? " current" : ""}" data-week="${i}">
          <span class="num">${w.n}</span>
          <span class="mid">
            ${phasePill(w.phase)}
            <small>${shortDate(start)} – ${shortDate(addDays(start, 6))}${w.key ? " · " + esc(w.key) : ""}</small>
            <span class="hbar"><i style="width:${(w.hours / max) * 100}%"></i></span>
          </span>
          <span class="hours">${hours(w.hours)}</span>
        </button>`;
      })
      .join("");
    document.querySelectorAll(".plan-row").forEach((el) =>
      el.addEventListener("click", () => {
        current = Number(el.dataset.week);
        renderWeek();
        showView("week");
        window.scrollTo({ top: 0, behavior: "smooth" });
      })
    );
  }

  function renderZones() {
    $("zones-note").textContent = plan.note;
    $("zones-status").textContent = plan.zones.status;
    $("zones-table").innerHTML = `
      <thead><tr><th>Disciplina</th><th>Referencia</th><th>Baja · Z1–Z2</th><th>Media · Z3</th><th>Alta · Z4–Z5</th></tr></thead>
      <tbody>${plan.zones.rows
        .map(
          (r) => `<tr class="${esc(r.sport)}">
            <td class="sport-cell"><span class="sport">${SPORT[r.sport]}</span></td>
            <td>${esc(r.ref)}</td><td>${esc(r.low)}</td><td>${esc(r.mid)}</td><td>${esc(r.high)}</td></tr>`
        )
        .join("")}</tbody>`;
    $("tests").innerHTML = plan.tests.map((t) => `<div class="card"><b>${esc(t.title)}</b><p>${esc(t.text)}</p></div>`).join("");
    $("gym").innerHTML = plan.gym.map((t) => `<div class="card"><b>${esc(t.title)}</b><p>${esc(t.text)}</p></div>`).join("");
  }

  function showView(name) {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.view === name));
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
  }

  function init() {
    const today = todayDate();
    const start = parseDate(plan.weeks[0].start);
    const idx = Math.floor((today - start) / (7 * DAY_MS));
    todayIdx = Math.min(Math.max(idx, 0), plan.weeks.length - 1);
    current = todayIdx;

    renderHeader();
    renderWeek();
    renderPlan();
    renderZones();

    document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => showView(t.dataset.view)));
    $("prev-week").addEventListener("click", () => { if (current > 0) { current--; renderWeek(); } });
    $("next-week").addEventListener("click", () => { if (current < plan.weeks.length - 1) { current++; renderWeek(); } });
  }

  fetch("data/plan.json", { cache: "no-store" })
    .then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then((data) => {
      plan = data;
      init();
    })
    .catch(() => {
      document.querySelector("main").innerHTML = '<p class="error">No se ha podido cargar el plan. Recarga la página.</p>';
    });
})();
