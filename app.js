(function () {
  "use strict";

  const STORAGE_KEY = "mindprism_v1";
  const TAG_OPTIONS = ["Deep work", "Exercise", "Sleep", "Social", "Learning", "Admin", "Outdoors"];

  const $ = (sel, root = document) => root.querySelector(sel);

  /** @type {{ id: string, ts: string, mood: number, energy: number, focus: number, note: string, tags: string[] }[]} */
  let entries = [];

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) entries = parsed.filter(validEntry);
    } catch {
      entries = [];
    }
  }

  function validEntry(e) {
    return (
      e &&
      typeof e.id === "string" &&
      typeof e.ts === "string" &&
      [e.mood, e.energy, e.focus].every((n) => typeof n === "number" && n >= 1 && n <= 5)
    );
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  function uid() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function formatWhen(iso) {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function mean(arr) {
    if (!arr.length) return null;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  function lastN(n) {
    return entries
      .slice()
      .sort((a, b) => new Date(b.ts) - new Date(a.ts))
      .slice(0, n);
  }

  function dayKey(d) {
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function streakDays() {
    if (!entries.length) return 0;
    const days = new Set(entries.map((e) => dayKey(new Date(e.ts))));
    let streak = 0;
    const anchor = new Date();
    for (let i = 0; i < 400; i++) {
      const d = new Date(anchor);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      if (days.has(key)) {
        streak++;
        continue;
      }
      if (i === 0) continue;
      break;
    }
    return streak;
  }

  function renderStats() {
    const recent = lastN(30);
    $("#statStreak").textContent = String(streakDays());
    $("#statCount").textContent = String(entries.length);
    const moods = recent.map((e) => e.mood);
    const m = mean(moods);
    $("#statMood").textContent = m == null ? "—" : m.toFixed(2);
    const fatigueProxy = mean(recent.map((e) => 6 - e.energy));
    const focusAvg = mean(recent.map((e) => e.focus));
    if (focusAvg == null || fatigueProxy == null) {
      $("#statBalance").textContent = "—";
    } else {
      const b = focusAvg - fatigueProxy;
      $("#statBalance").textContent = (b >= 0 ? "+" : "") + b.toFixed(2);
    }
  }

  /** @param {string} tag */
  function insightForTag(tag) {
    const withTag = entries.filter((e) => e.tags && e.tags.includes(tag));
    const withoutTag = entries.filter((e) => !e.tags || !e.tags.includes(tag));
    if (withTag.length < 3 || withoutTag.length < 3) return null;
    const mWith = mean(withTag.map((e) => e.mood + e.focus));
    const mWithout = mean(withoutTag.map((e) => e.mood + e.focus));
    if (mWith == null || mWithout == null) return null;
    const delta = mWith - mWithout;
    if (Math.abs(delta) < 0.15) return null;
    const dir = delta > 0 ? "higher" : "lower";
    return `When you tag **${tag}**, your combined mood+focus tends to be **${dir}** than sessions without it (Δ ≈ ${delta.toFixed(2)} on a 2–10 scale).`;
  }

  function renderInsights() {
    const ul = $("#insightList");
    ul.innerHTML = "";
    const lines = [];
    for (const t of TAG_OPTIONS) {
      const s = insightForTag(t);
      if (s) lines.push(s);
    }
    if (!lines.length) {
      const li = document.createElement("li");
      li.textContent =
        "Log more pulses with different tags — after a handful of each, MindPrism surfaces simple correlations (no cloud, no model).";
      ul.appendChild(li);
      return;
    }
    for (const line of lines) {
      const li = document.createElement("li");
      const parts = line.split(/\*\*(.+?)\*\*/g);
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 1) {
          const strong = document.createElement("strong");
          strong.textContent = parts[i];
          li.appendChild(strong);
        } else if (parts[i]) {
          li.appendChild(document.createTextNode(parts[i]));
        }
      }
      ul.appendChild(li);
    }
  }

  function renderTable() {
    const tbody = $("#pulseRows");
    const empty = $("#emptyState");
    tbody.innerHTML = "";
    const sorted = entries.slice().sort((a, b) => new Date(b.ts) - new Date(a.ts));
    if (!sorted.length) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    for (const e of sorted.slice(0, 80)) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="mono">${formatWhen(e.ts)}</td>
        <td>${e.mood}</td>
        <td>${e.energy}</td>
        <td>${e.focus}</td>
        <td>${(e.tags || []).join(", ") || "—"}</td>
        <td>${escapeHtml((e.note || "").slice(0, 80))}${(e.note || "").length > 80 ? "…" : ""}</td>
        <td><button type="button" class="btn icon" data-id="${e.id}">Remove</button></td>
      `;
      tbody.appendChild(tr);
    }
    tbody.querySelectorAll("button[data-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        entries = entries.filter((x) => x.id !== id);
        save();
        refresh();
      });
    });
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderConstellation() {
    const canvas = $("#constellation");
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || 900;
    const h = 320;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const byDay = new Map();
    for (const e of entries) {
      const d = new Date(e.ts);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key).push(e);
    }
    const keys = [...byDay.keys()].sort();
    if (keys.length < 2) {
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--muted").trim() || "#9aa3c7";
      ctx.font = "14px Instrument Sans, sans-serif";
      ctx.fillText("Add pulses across multiple days to light up the constellation.", 24, h / 2);
      return;
    }

    const points = keys.map((k, i) => {
      const list = byDay.get(k);
      const avgMood = mean(list.map((x) => x.mood));
      const avgFocus = mean(list.map((x) => x.focus));
      const t = i / Math.max(keys.length - 1, 1);
      const x = 40 + t * (w - 80);
      const y = h * 0.55 - (avgFocus - 2.5) * 28 + Math.sin(i * 0.7) * 18;
      return { x, y, mood: avgMood, k };
    });

    ctx.strokeStyle = "rgba(110, 243, 214, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#6ef3d6";
    const accent2 = getComputedStyle(document.documentElement).getPropertyValue("--accent2").trim() || "#c78bff";

    points.forEach((p) => {
      const r = 4 + (p.mood - 1) * 2.5;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4);
      g.addColorStop(0, accent);
      g.addColorStop(0.4, accent2 + "99");
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function buildTagChoices() {
    const wrap = $("#tagChoices");
    wrap.innerHTML = "";
    for (const t of TAG_OPTIONS) {
      const label = document.createElement("label");
      label.className = "tag-chip";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = "tags";
      input.value = t;
      const span = document.createElement("span");
      span.textContent = t;
      label.appendChild(input);
      label.appendChild(span);
      wrap.appendChild(label);
    }
  }

  function bindSliders() {
    const map = [
      ["#mood", "#moodVal"],
      ["#energy", "#energyVal"],
      ["#focus", "#focusVal"],
    ];
    for (const [inp, out] of map) {
      const el = $(inp);
      const o = $(out);
      const sync = () => {
        o.textContent = el.value;
      };
      el.addEventListener("input", sync);
      sync();
    }
  }

  $("#pulseForm").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const mood = +$("#mood").value;
    const energy = +$("#energy").value;
    const focus = +$("#focus").value;
    const note = $("#note").value.trim();
    const tags = [...$$("#tagChoices input:checked")].map((i) => i.value);
    entries.push({
      id: uid(),
      ts: new Date().toISOString(),
      mood,
      energy,
      focus,
      note,
      tags,
    });
    save();
    $("#note").value = "";
    $$("#tagChoices input").forEach((i) => {
      i.checked = false;
    });
    const hint = $("#saveHint");
    hint.textContent = "Saved locally.";
    setTimeout(() => {
      hint.textContent = "";
    }, 2500);
    refresh();
  });

  function $$(sel, root = document) {
    return [...root.querySelectorAll(sel)];
  }

  function refresh() {
    renderStats();
    renderInsights();
    renderTable();
    renderConstellation();
  }

  function clock() {
    const el = $("#liveClock");
    const tick = () => {
      el.textContent = new Date().toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    };
    tick();
    setInterval(tick, 1000);
  }

  function themeInit() {
    const stored = localStorage.getItem("mindprism_theme");
    if (stored === "light") document.documentElement.setAttribute("data-theme", "light");
    $("#btnTheme").addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      if (next === "light") document.documentElement.setAttribute("data-theme", "light");
      else document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("mindprism_theme", next);
      refresh();
    });
  }

  $("#btnExport").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), entries }, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mindprism-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $("#importFile").addEventListener("change", (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        const incoming = Array.isArray(data) ? data : data.entries;
        if (!Array.isArray(incoming)) throw new Error("bad shape");
        const merged = incoming.filter(validEntry).map((e) => ({ ...e, id: e.id || uid() }));
        entries = merged;
        save();
        refresh();
        $("#saveHint").textContent = "Import applied.";
        setTimeout(() => {
          $("#saveHint").textContent = "";
        }, 2500);
      } catch {
        alert("Could not read that JSON file.");
      }
      ev.target.value = "";
    };
    reader.readAsText(file);
  });

  /* Focus timer */
  let focusRemaining = 25 * 60;
  let focusInterval = null;
  let focusPaused = true;
  let selectedMinutes = 25;

  const overlay = $("#focusOverlay");
  const label = $("#focusTimer");
  const btnFocusStart = $("#btnFocusStart");
  const btnFocusPause = $("#btnFocusPause");

  function formatSec(s) {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  function updateFocusLabel() {
    label.textContent = formatSec(Math.max(0, focusRemaining));
  }

  function syncFocusStartLabel() {
    const full = selectedMinutes * 60;
    if (focusPaused && focusRemaining > 0 && focusRemaining < full) {
      btnFocusStart.textContent = "Resume";
    } else {
      btnFocusStart.textContent = "Start";
    }
  }

  function stopFocusTimer() {
    if (focusInterval) clearInterval(focusInterval);
    focusInterval = null;
    focusPaused = true;
    btnFocusPause.disabled = true;
    btnFocusStart.disabled = false;
    syncFocusStartLabel();
  }

  $$(".focus-controls button[data-min]").forEach((b) => {
    b.addEventListener("click", () => {
      selectedMinutes = +b.getAttribute("data-min");
      focusRemaining = selectedMinutes * 60;
      stopFocusTimer();
      updateFocusLabel();
    });
  });

  $("#btnFocus").addEventListener("click", () => {
    overlay.hidden = false;
    focusRemaining = selectedMinutes * 60;
    stopFocusTimer();
    updateFocusLabel();
  });

  $("#btnFocusClose").addEventListener("click", () => {
    overlay.hidden = true;
    stopFocusTimer();
  });

  btnFocusStart.addEventListener("click", () => {
    if (!focusPaused) return;
    focusPaused = false;
    btnFocusPause.disabled = false;
    btnFocusStart.disabled = true;
    btnFocusStart.textContent = "Start";
    if (focusInterval) clearInterval(focusInterval);
    focusInterval = setInterval(() => {
      if (focusRemaining <= 0) {
        stopFocusTimer();
        if ("vibrate" in navigator) navigator.vibrate([120, 80, 120]);
        label.textContent = "Done";
        setTimeout(() => {
          focusRemaining = selectedMinutes * 60;
          updateFocusLabel();
          syncFocusStartLabel();
        }, 1600);
        return;
      }
      focusRemaining -= 1;
      updateFocusLabel();
    }, 1000);
  });

  btnFocusPause.addEventListener("click", () => {
    focusPaused = true;
    btnFocusPause.disabled = true;
    btnFocusStart.disabled = false;
    if (focusInterval) clearInterval(focusInterval);
    focusInterval = null;
    syncFocusStartLabel();
  });

  window.addEventListener("resize", () => {
    renderConstellation();
  });

  load();
  buildTagChoices();
  bindSliders();
  clock();
  themeInit();
  refresh();
})();
