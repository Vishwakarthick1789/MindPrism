# MindPrism

**MindPrism** is a local-first **cognitive telemetry** workspace. It turns quick self-reports (mood, energy, focus) into a living **constellation timeline**, **streak-aware statistics**, and **transparent, on-device insights** derived from your tags—not from the cloud and not from a black-box model.

## Why MindPrism exists

Most wellness apps optimize for engagement metrics. MindPrism optimizes for **clarity**: a calm interface, data that never leaves your machine unless you export it, and insights you can reason about because they are simple comparisons of averages you actually logged.

## Features

| Capability | Description |
|------------|-------------|
| **Daily pulse** | Log mood, energy, and focus on a 1–5 scale with optional notes and tags. |
| **Constellation** | Days appear as nodes; brightness reflects mood, vertical motion reflects focus; paths connect your timeline. |
| **Prism insights** | For each built-in tag, compares sessions *with* vs *without* that tag (minimum sample sizes apply). |
| **Streaks & balance** | Streak counts consecutive days with at least one log (today may be skipped if not yet logged). “Balance” approximates focus vs fatigue from recent entries. |
| **Focus mode** | Full-screen timer (5 / 15 / 25 minutes) with a guided **breathing orb**—inhale on expansion, exhale on contraction. |
| **Themes** | Dark (default) and light, persisted in the browser. |
| **Export / import** | Download all pulses as JSON; restore or migrate by importing a compatible file. |

## Privacy & data

- Storage: **browser `localStorage`** only (per origin).
- **No accounts**, **no servers** required for the app itself.
- If you use the optional local HTTP server in `start.bat`, traffic stays on **127.0.0.1** on your computer.

## Requirements

- A modern desktop browser (**Chrome**, **Edge**, or **Firefox** recommended).
- **Python 3.x** on your PATH (optional but recommended) so `start.bat` can serve the app over `http://127.0.0.1:8765/`. If Python is missing, the launcher falls back to opening `index.html` directly (fonts may still load if you are online).

## Quick start (Windows)

1. Clone or copy the **MindPrism** folder anywhere on your PC.
2. Double-click **`start.bat`**.
   - A small window titled **MindPrism Server** may stay open while Python serves the files; you can close it when you are done to free the port.
3. Your browser should open automatically. If it does not, visit `http://127.0.0.1:8765/` manually.

### Manual start (any OS)

From the MindPrism directory:

```bash
python -m http.server 8765
```

Then open `http://127.0.0.1:8765/` in your browser.

### Without Python

Open `index.html` directly. Core features work; offline font fallbacks apply if Google Fonts cannot load.

## Project layout

```
MindPrism/
├── index.html      # Structure & copy
├── styles.css      # Visual system (glass, aurora, focus overlay)
├── app.js          # Storage, stats, constellation, insights, focus timer
├── start.bat       # Windows launcher (Python server + browser)
└── README.md       # This file
```

## Tag reference

Built-in tags power correlation insights: **Deep work**, **Exercise**, **Sleep**, **Social**, **Learning**, **Admin**, **Outdoors**. Insights appear once there are enough tagged and untagged sessions to compare meaningfully.

## Export format

JSON shape:

```json
{
  "version": 1,
  "exportedAt": "2026-04-18T12:00:00.000Z",
  "entries": [
    {
      "id": "unique-id",
      "ts": "2026-04-18T12:00:00.000Z",
      "mood": 4,
      "energy": 3,
      "focus": 4,
      "note": "optional text",
      "tags": ["Deep work"]
    }
  ]
}
```

Legacy import: a bare JSON **array** of entries is also accepted.

## Roadmap ideas (not implemented)

- Encrypted export, optional passphrase.
- Custom tags and editable insight thresholds.
- PWA install manifest for mobile home-screen use.

## License

You may use, modify, and share this project for personal or educational purposes. Attribution appreciated.

---

**MindPrism** — *refract your day into clarity.*
