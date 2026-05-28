# Explosion Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add explosion animation chain when the last life is lost in Minesweeper.

**Architecture:** Pure CSS animations driven by inline custom properties; JS orchestrates timing chain (flash → fly-away → final explosion → game over).

**Tech Stack:** Vanilla JS, CSS3 animations, no dependencies.

---

### Task 1: CSS animations — fire flash, fly-away, final explosion

**Files:**
- Modify: `style.css` (add keyframes and classes at end of file)

- [ ] **Step 1: Add fire-flash keyframes and class**

```css
/* === Explosion animations === */

.fire-flash {
    position: absolute;
    top: -20px;
    left: -20px;
    width: 70px;
    height: 70px;
    border-radius: 50%;
    pointer-events: none;
    z-index: 300;
    background: radial-gradient(circle, rgba(255,220,80,0.95) 0%, rgba(255,80,0,0.7) 30%, rgba(200,30,0,0.3) 60%, transparent 100%);
    animation: fire-flash-anim 0.6s ease-out forwards;
}

@keyframes fire-flash-anim {
    0% { transform: scale(0.2); opacity: 0; }
    20% { transform: scale(1.5); opacity: 1; }
    50% { transform: scale(2); opacity: 0.8; }
    100% { transform: scale(2.5); opacity: 0; }
}
```

- [ ] **Step 2: Add fly-away keyframes and class**

```css
.cell-flying {
    z-index: 50;
    animation: cell-fly-away var(--duration, 800ms) ease-in var(--delay, 0ms) forwards;
    pointer-events: none;
}

@keyframes cell-fly-away {
    0% {
        transform: translate(0, 0) rotate(0deg);
        opacity: 1;
    }
    100% {
        transform: translate(var(--tx, 0px), var(--ty, 0px)) rotate(var(--rot, 0deg));
        opacity: 0;
    }
}
```

- [ ] **Step 3: Add mine-final-explode keyframes and class**

```css
.mine-final-explode {
    animation: mine-blast 0.5s ease-out forwards;
}

@keyframes mine-blast {
    0% { transform: scale(0); opacity: 0; }
    20% { transform: scale(1.8); opacity: 1; filter: brightness(3); }
    40% { transform: scale(0.6); filter: brightness(2); }
    60% { transform: scale(1.3); filter: brightness(1.5); }
    100% { transform: scale(1); filter: brightness(1); }
}
```

- [ ] **Step 4: Verify CSS loads without errors**

Open `index.html` in browser, check DevTools console for CSS errors.

- [ ] **Step 5: Commit**

```bash
git add style.css
git commit -m "feat: add explosion animation keyframes and classes"
```

### Task 2: JS — explosionInProgress guard

**Files:**
- Modify: `script.js`

- [ ] **Step 1: Add `explosionInProgress` field to constructor**

In class constructor, after `this.gameWon = false;` add:

```javascript
this.explosionInProgress = false;
```

Also in `newGame()` method, after `this.gameWon = false;` add:

```javascript
this.explosionInProgress = false;
```

Also in `restoreGame()` method, add:

```javascript
this.explosionInProgress = false;
```

- [ ] **Step 2: Add guard in handleCellClick and handleRightClick**

In `handleCellClick` first line, change to:

```javascript
if (this.gameOver || this.gameWon || this.explosionInProgress) return;
```

In `handleRightClick` first line, change to:

```javascript
if (this.gameOver || this.gameWon || this.explosionInProgress) return;
```

- [ ] **Step 3: Commit**

```bash
git add script.js
git commit -m "feat: add explosionInProgress guard flag"
```

### Task 3: JS — fire flash and fly-away methods

**Files:**
- Modify: `script.js`

- [ ] **Step 1: Add `showFireFlash(row, col)` method after `showGuardianAngel`**

```javascript
showFireFlash(row, col) {
    const cellElement = this.getCellElement(row, col);
    const flash = document.createElement('div');
    flash.className = 'fire-flash';
    cellElement.appendChild(flash);
    setTimeout(() => {
        if (flash.parentNode) flash.parentNode.removeChild(flash);
    }, 600);
}
```

- [ ] **Step 2: Add `flyAwayCells(centerRow, centerCol)` method after `showFireFlash`**

```javascript
flyAwayCells(centerRow, centerCol) {
    const maxDist = 2;
    for (let i = 0; i < this.rows; i++) {
        for (let j = 0; j < this.cols; j++) {
            const dx = j - centerCol;
            const dy = i - centerRow;
            const dist = Math.max(Math.abs(dx), Math.abs(dy));
            if (dist < 1 || dist > maxDist) continue;
            if (this.board[i][j].isRevealed) continue;

            const cellEl = this.getCellElement(i, j);
            if (!cellEl) continue;

            const dirX = dx === 0 ? 0 : dx / Math.abs(dx);
            const dirY = dy === 0 ? 0 : dy / Math.abs(dy);

            const travelX = (dirX || (Math.random() > 0.5 ? 1 : -1)) * (80 + Math.random() * 80) * dist;
            const travelY = (dirY || (Math.random() > 0.5 ? 1 : -1)) * (80 + Math.random() * 80) * dist;
            const rot = (Math.random() - 0.5) * 1440;
            const duration = 600 + Math.random() * 400;
            const delay = dist * 40;

            cellEl.style.setProperty('--tx', `${travelX}px`);
            cellEl.style.setProperty('--ty', `${travelY}px`);
            cellEl.style.setProperty('--rot', `${rot}deg`);
            cellEl.style.setProperty('--duration', `${duration}ms`);
            cellEl.style.setProperty('--delay', `${delay}ms`);
            cellEl.classList.add('cell-flying');
        }
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add script.js
git commit -m "feat: add showFireFlash and flyAwayCells methods"
```

### Task 4: JS — final mine explosion and trigger chain

**Files:**
- Modify: `script.js`

- [ ] **Step 1: Add `explodeAllMines()` method**

Add after `flyAwayCells`:

```javascript
explodeAllMines() {
    for (let i = 0; i < this.rows; i++) {
        for (let j = 0; j < this.cols; j++) {
            const cell = this.board[i][j];
            if (!cell.isMine || cell.isFlagged) continue;
            const cellEl = this.getCellElement(i, j);
            if (!cellEl) continue;
            cellEl.classList.add('mine-final-explode');
            cellEl.textContent = '💣';
        }
    }
}
```

- [ ] **Step 2: Add `triggerExplosionChain(row, col)` method**

Add after `explodeAllMines`:

```javascript
triggerExplosionChain(row, col) {
    this.explosionInProgress = true;
    this.revealAllMinesFirstPass();

    this.showFireFlash(row, col);

    setTimeout(() => {
        this.flyAwayCells(row, col);
    }, 200);

    setTimeout(() => {
        this.explodeAllMines();
    }, 600);

    setTimeout(() => {
        this.endGame(false);
    }, 1200);
}
```

- [ ] **Step 3: Add `revealAllMinesFirstPass()` helper**

Add after `triggerExplosionChain`:

```javascript
revealAllMinesFirstPass() {
    for (let i = 0; i < this.rows; i++) {
        for (let j = 0; j < this.cols; j++) {
            const cell = this.board[i][j];
            const cellEl = this.getCellElement(i, j);
            if (cell.isMine && !cell.isFlagged) {
                cell.isRevealed = true;
                cellEl.classList.add('revealed');
                cellEl.classList.add('mine-exploded');
            }
            if (!cell.isMine && cell.isFlagged) {
                cellEl.textContent = '❌';
            }
        }
    }
}
```

- [ ] **Step 4: Modify `loseLife()` to use the explosion chain**

Replace the `if (this.lives <= 0)` branch in `loseLife()`:

```javascript
if (this.lives <= 0) {
    this.triggerExplosionChain(row, col);
} else {
    cell.isFlagged = true;
    this.flagsCount++;
    cellElement.classList.add('flagged');
    cellElement.textContent = '🚩';
    this.showGuardianAngel(cellElement);
    this.updateMinesDisplay();
}
```

Also fix the duplicate `showGuardianAngel` call in the `else` block — remove the first one that appears before the if/else:

In `loseLife()`, remove the standalone `this.showGuardianAngel(cellElement);` call (line ~450), keep only the one inside the `else` block.

- [ ] **Step 5: Commit**

```bash
git add script.js
git commit -m "feat: add explosion chain and final mine blast"
```

### Task 5: Verify in browser

- [ ] **Step 1: Open `index.html` in browser**

Test on a difficulty with lives (e.g., medium — 2 lives):
1. Start a game, click a mine cell to lose first life (guardian angel shows)
2. Click another mine cell to lose last life — explosion animation should play:
   - Fire flash at exploded cell
   - Nearby unrevealed cells fly away from center with rotation
   - All unflagged mines explode one by one
   - Game ends with "Поражение!"
3. Start a new game — verify no animation artifacts remain

- [ ] **Step 2: Fix any issues found**

If animations don't play or look wrong, diagnose and fix.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: adjustments after explosion animation testing"
```
