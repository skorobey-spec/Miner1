class Minesweeper {
    constructor() {
        this.board = [];
        this.rows = 0;
        this.cols = 0;
        this.minesCount = 0;
        this.flagsCount = 0;
        this.revealedCount = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.timer = 0;
        this.timerInterval = null;

        this.leftMouseDown = false;
        this.rightMouseDown = false;
        this.chordHandled = new Set();
        this.protectedMines = new Set();
        this.lives = 0;
        this.maxLives = 0;

        this.difficulties = {
            easy: { rows: 9, cols: 9, mines: 10, lives: 1 },
            medium: { rows: 16, cols: 16, mines: 40, lives: 2 },
            hard: { rows: 16, cols: 30, mines: 99, lives: 3 },
            crazy: { rows: 66, cols: 34, mines: 500, lives: 3 },
            mysterious: { rows: 106, cols: 60, mines: 1000, lives: 3 }
        };

        this.initElements();
        this.bindEvents();
        this.bindSaveEvents();

        const saved = this.loadGame();
        if (saved) {
            this.restoreGame(saved);
        } else {
            this.newGame();
        }
    }

    initElements() {
        this.gameBoard = document.getElementById('game-board');
        this.minesCountElement = document.getElementById('mines-count');
        this.timerElement = document.getElementById('timer');
        this.livesElement = document.getElementById('lives');
        this.gameStatusElement = document.getElementById('game-status');
        this.difficultySelect = document.getElementById('difficulty');
        this.newGameButton = document.getElementById('new-game');
    }

    bindEvents() {
        this.newGameButton.addEventListener('click', () => this.newGame());
        this.difficultySelect.addEventListener('change', () => this.newGame());
    }

    bindSaveEvents() {
        window.addEventListener('beforeunload', () => this.saveGame());
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.saveGame();
            }
        });
    }

    saveGame() {
        if (this.gameOver || this.gameWon || this.firstClick) {
            localStorage.removeItem('minesweeper_save');
            return;
        }

        const data = {
            board: this.board,
            rows: this.rows,
            cols: this.cols,
            minesCount: this.minesCount,
            flagsCount: this.flagsCount,
            revealedCount: this.revealedCount,
            lives: this.lives,
            maxLives: this.maxLives,
            timer: this.timer,
            difficulty: this.difficultySelect.value,
            protectedMines: [...this.protectedMines],
            chordHandled: [...this.chordHandled],
            leftMouseDown: this.leftMouseDown,
            rightMouseDown: this.rightMouseDown
        };

        localStorage.setItem('minesweeper_save', JSON.stringify(data));
    }

    loadGame() {
        const raw = localStorage.getItem('minesweeper_save');
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            localStorage.removeItem('minesweeper_save');
            return null;
        }
    }

    restoreGame(data) {
        this.board = data.board;
        this.rows = data.rows;
        this.cols = data.cols;
        this.minesCount = data.minesCount;
        this.flagsCount = data.flagsCount;
        this.revealedCount = data.revealedCount;
        this.lives = data.lives;
        this.maxLives = data.maxLives;
        this.timer = data.timer;
        this.firstClick = false;
        this.gameOver = false;
        this.gameWon = false;
        this.protectedMines = new Set(data.protectedMines);
        this.chordHandled = new Set(data.chordHandled);
        this.leftMouseDown = false;
        this.rightMouseDown = false;

        this.difficultySelect.value = data.difficulty;
        this.updateTimerDisplay();
        this.updateMinesDisplay();
        this.renderLives();
        this.updateStatus('Игра (сохранена)', '');

        this.renderBoard();
        this.renderBoardState();
        this.startTimer();
    }

    renderBoardState() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const cell = this.board[i][j];
                const cellElement = this.getCellElement(i, j);

                if (cell.isRevealed) {
                    cellElement.classList.add('revealed');
                    if (cell.isMine) {
                        cellElement.classList.add('mine');
                        cellElement.textContent = '💣';
                    } else if (cell.neighborMines > 0) {
                        cellElement.textContent = cell.neighborMines;
                        cellElement.classList.add(`number-${cell.neighborMines}`);
                    }
                } else if (cell.isFlagged) {
                    cellElement.classList.add('flagged');
                    cellElement.textContent = '🚩';
                }
            }
        }
    }

    newGame() {
        const difficulty = this.difficulties[this.difficultySelect.value];
        this.rows = difficulty.rows;
        this.cols = difficulty.cols;
        this.minesCount = difficulty.mines;
        this.maxLives = difficulty.lives;
        this.lives = difficulty.lives;
        this.flagsCount = 0;
        this.revealedCount = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.leftMouseDown = false;
        this.rightMouseDown = false;
        this.chordHandled = new Set();
        this.protectedMines = new Set();
        this.firstClick = true;
        this.timer = 0;

        this.stopTimer();
        this.updateTimerDisplay();
        this.updateMinesDisplay();
        this.renderLives();
        this.updateStatus('Игра', '');

        this.createBoard();
        this.renderBoard();

        localStorage.removeItem('minesweeper_save');
    }

    createBoard() {
        this.board = [];
        for (let i = 0; i < this.rows; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.board[i][j] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0
                };
            }
        }
    }

    placeMines(excludeRow, excludeCol) {
        let minesPlaced = 0;
        const excludeCells = this.getNeighbors(excludeRow, excludeCol);
        excludeCells.push({ row: excludeRow, col: excludeCol });

        while (minesPlaced < this.minesCount) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);

            if (!this.board[row][col].isMine) {
                const isExcluded = excludeCells.some(cell => 
                    cell.row === row && cell.col === col
                );

                if (!isExcluded) {
                    this.board[row][col].isMine = true;
                    minesPlaced++;
                }
            }
        }

        this.calculateNeighborMines();
    }

    getNeighbors(row, col) {
        const neighbors = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
                    neighbors.push({ row: newRow, col: newCol });
                }
            }
        }
        return neighbors;
    }

    calculateNeighborMines() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (!this.board[i][j].isMine) {
                    const neighbors = this.getNeighbors(i, j);
                    this.board[i][j].neighborMines = neighbors.filter(
                        cell => this.board[cell.row][cell.col].isMine
                    ).length;
                }
            }
        }
    }

    renderBoard() {
        this.gameBoard.innerHTML = '';
        this.gameBoard.style.gridTemplateColumns = `repeat(${this.cols}, 30px)`;
        this.gameBoard.style.gridTemplateRows = `repeat(${this.rows}, 30px)`;

        // Remove old listener by replacing the element's method
        this.gameBoard.oncontextmenu = (e) => e.preventDefault();

        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;

                cell.addEventListener('mousedown', (e) => this.handleMouseDown(i, j, e));
                cell.addEventListener('mouseup', (e) => this.handleMouseUp(i, j, e));

                this.gameBoard.appendChild(cell);
            }
        }
    }

    handleMouseDown(row, col, e) {
        if (e.button === 0) this.leftMouseDown = true;
        if (e.button === 2) this.rightMouseDown = true;

        if (this.leftMouseDown && this.rightMouseDown) {
            this.tryChord(row, col);
        }
    }

    handleMouseUp(row, col, e) {
        const wasBothPressed = this.leftMouseDown && this.rightMouseDown;

        if (e.button === 0) this.leftMouseDown = false;
        if (e.button === 2) this.rightMouseDown = false;

        if (!wasBothPressed && e.button === 0) {
            this.handleCellClick(row, col);
        }

        if (!wasBothPressed && e.button === 2) {
            this.handleRightClick(row, col);
        }
    }

    tryChord(row, col) {
        const key = `${row},${col}`;
        if (this.chordHandled.has(key)) return;

        const cell = this.board[row][col];
        if (!cell.isRevealed || cell.neighborMines === 0) return;

        const neighbors = this.getNeighbors(row, col);
        const flaggedNeighbors = neighbors.filter(
            n => this.board[n.row][n.col].isFlagged
        ).length;

        if (flaggedNeighbors !== cell.neighborMines) {
            this.highlightUnrevealedNeighbors(neighbors);
            return;
        }

        this.chordHandled.add(key);

        let hitMine = false;
        for (const n of neighbors) {
            const neighbor = this.board[n.row][n.col];
            if (!neighbor.isRevealed && !neighbor.isFlagged) {
                this.revealCell(n.row, n.col);
                if (neighbor.isMine) {
                    hitMine = true;
                    const mineKey = `${n.row},${n.col}`;
                    if (!this.protectedMines.has(mineKey) && this.lives > 0) {
                        this.protectedMines.add(mineKey);
                        this.loseLife(n.row, n.col);
                    }
                }
            }
        }

        if (hitMine && this.lives <= 0) {
            setTimeout(() => this.endGame(false), 1200);
        } else if (!hitMine) {
            this.checkWin();
        }
    }

    highlightUnrevealedNeighbors(neighbors) {
        neighbors.forEach(n => {
            const cell = this.board[n.row][n.col];
            if (!cell.isRevealed && !cell.isFlagged) {
                const cellElement = this.getCellElement(n.row, n.col);
                cellElement.classList.add('highlight');
                setTimeout(() => {
                    cellElement.classList.remove('highlight');
                }, 100);
            }
        });
    }

    handleCellClick(row, col) {
        if (this.gameOver || this.gameWon) return;
        if (this.board[row][col].isFlagged) return;
        if (this.board[row][col].isRevealed) return;

        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(row, col);
            this.startTimer();
        }

        //this.revealCell(row, col);

        if (this.board[row][col].isMine) {
            const key = `${row},${col}`;
            if (!this.protectedMines.has(key) && this.lives > 0) {
                this.protectedMines.add(key);
                this.loseLife(row, col);
            } else if (!this.protectedMines.has(key)) {
                this.endGame(false);
            }
        } else {
            this.revealCell(row, col);
            this.checkWin();
        }
    }

    handleRightClick(row, col) {
        if (this.gameOver || this.gameWon) return;
        if (this.board[row][col].isRevealed) return;

        const cell = this.board[row][col];
        const cellElement = this.getCellElement(row, col);

        if (!cell.isFlagged) {
            cell.isFlagged = true;
            this.flagsCount++;
            cellElement.classList.add('flagged');
            cellElement.textContent = '🚩';
        } else {
            cell.isFlagged = false;
            this.flagsCount--;
            cellElement.classList.remove('flagged');
            cellElement.textContent = '';
        }

        this.updateMinesDisplay();
        this.saveGame();
    }

    revealCell(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
        if (this.board[row][col].isRevealed) return;
        if (this.board[row][col].isFlagged) return;

        const cell = this.board[row][col];
        cell.isRevealed = true;
        this.revealedCount++;

        const cellElement = this.getCellElement(row, col);
        cellElement.classList.add('revealed');

        if (cell.isMine && this.lives <= 0) {
            cellElement.classList.add('mine');
            cellElement.textContent = '💣';
            return;
        }

        if (cell.neighborMines > 0) {
            cellElement.textContent = cell.neighborMines;
            cellElement.classList.add(`number-${cell.neighborMines}`);
        } else {
            const neighbors = this.getNeighbors(row, col);
            neighbors.forEach(neighbor => {
                this.revealCell(neighbor.row, neighbor.col);
            });
        }

        this.saveGame();
    }

    loseLife(row, col) {
        this.lives--;
        this.renderLives(true);

        const cell = this.board[row][col];
        const cellElement = this.getCellElement(row, col);
        this.showGuardianAngel(cellElement);

        if (this.lives <= 0) {
            cellElement.classList.add('mine-exploded');
            setTimeout(() => this.endGame(false), 1000);
        }else{
            cell.isFlagged = true;
            this.flagsCount++;
            cellElement.classList.add('flagged');
            cellElement.textContent = '🚩';
            this.showGuardianAngel(cellElement);
            this.updateMinesDisplay();
        }
    }

    showGuardianAngel(cellElement) {
        const angel = document.createElement('div');
        angel.className = 'guardian-angel';
        angel.textContent = '👼';
        cellElement.appendChild(angel);

        setTimeout(() => {
            if (angel.parentNode) {
                angel.parentNode.removeChild(angel);
            }
        }, 1200);
    }

    renderLives(burning = false) {
        this.livesElement.innerHTML = '';
        for (let i = 0; i < this.maxLives; i++) {
            const angel = document.createElement('span');
            angel.className = 'angel-life';
            angel.textContent = '👼';

            if (i >= this.lives && burning) {
                angel.classList.add('burning');
            } else if (i >= this.lives) {
                angel.style.opacity = '0';
                angel.style.transform = 'scale(0)';
            }

            this.livesElement.appendChild(angel);
        }
    }

    checkWin() {
        const totalCells = this.rows * this.cols;
        const safeCells = totalCells - this.minesCount;

        if (this.revealedCount === safeCells) {
            this.endGame(true);
        }
    }

    endGame(isWin) {
        this.gameOver = true;
        this.stopTimer();
        localStorage.removeItem('minesweeper_save');

        if (isWin) {
            this.gameWon = true;
            this.updateStatus('Победа!', 'win');
            this.revealAllMines(false, true);
        } else {
            this.updateStatus('Поражение!', 'lose');
            this.revealAllMines(true, false);
        }
    }

    revealAllMines(showExploded = false, showWin = false) {
        const winMines = [];

        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const cell = this.board[i][j];
                const cellElement = this.getCellElement(i, j);

                if (showWin && cell.isMine) {
                    if (!cell.isFlagged) {
                        cell.isFlagged = true;
                        this.flagsCount++;
                        cellElement.classList.add('flagged');
                        cellElement.textContent = '🚩';
                    }
                    winMines.push(cellElement);
                } else if (showExploded && cell.isMine && !cell.isFlagged) {
                    cellElement.classList.add('mine');
                    cellElement.textContent = '💣';
                    if (cell.isRevealed) {
                        cellElement.classList.add('mine-exploded');
                    }
                }

                if (!cell.isMine && cell.isFlagged) {
                    cellElement.textContent = '❌';
                }
            }
        }

        this.updateMinesDisplay();

        if (showWin && winMines.length > 0) {
            setTimeout(() => {
                winMines.forEach((el, idx) => {
                    setTimeout(() => {
                        el.classList.add('flag-win');
                    }, idx * 30);
                });
            }, 300);
        }
    }

    getCellElement(row, col) {
        return this.gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timer / 60).toString().padStart(2, '0');
        const seconds = (this.timer % 60).toString().padStart(2, '0');
        this.timerElement.textContent = `${minutes}:${seconds}`;
    }

    updateMinesDisplay() {
        this.minesCountElement.textContent = this.minesCount - this.flagsCount;
    }

    updateStatus(text, className) {
        this.gameStatusElement.textContent = text;
        this.gameStatusElement.className = 'stat-value';
        if (className) {
            this.gameStatusElement.classList.add(className);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
});