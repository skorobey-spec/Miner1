# AGENTS.md — miner1

**Language**: отвечай и размышляй на русском языке.

**Minesweeper** ("Сапёр") — browser-based vanilla JS game with a lives mechanic. No build system, no tests, no dependencies.

## Serve / Run

Open `index.html` directly in a browser (no server needed). No package.json, no npm, no build step.

## Architecture

- `index.html` — entry point; loads `style.css` and `script.js`
- `script.js` — single `Minesweeper` class; all game logic in one file (~590 lines)
- `style.css` — all visual styles, animations, responsive breakpoints

UI language is **Russian** (labels, status, difficulty names).

## Key Mechanics

| Difficulty | Grid | Mines | Lives |
|---|---|---|---|
| easy | 9×9 | 10 | 1 |
| medium | 16×16 | 40 | 2 |
| hard | 16×30 | 99 | 3 |
| crazy | 66×34 | 500 | 3 |
| mysterious | 106×60 | 1000 | 3 |

- **First-click safety**: mines are placed *after* first click, excluding the clicked cell + its neighbors
- **Lives**: hitting a mine consumes a life; the mine is auto-flagged (guardian angel 👼 animation); game ends only when lives reach 0
- **Chording**: press both mouse buttons on a revealed number to open neighbors when flag count matches
- **Auto-save**: game state persisted to `localStorage` key `minesweeper_save` on `beforeunload` and `visibilitychange` events
- **No backend, no APIs, no external dependencies**

## Git

Single branch (`main`). `.gitignore` only excludes `.qwen/`.
