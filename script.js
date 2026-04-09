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

        this.difficulties = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 },
            crazy: { rows: 66, cols: 34, mines: 500 },
            mysterious: { rows: 106, cols: 60, mines: 1000 }
        };

        this.initElements();
        this.bindEvents();
        this.newGame();
    }

    initElements() {
        this.gameBoard = document.getElementById('game-board');
        this.minesCountElement = document.getElementById('mines-count');
        this.timerElement = document.getElementById('timer');
        this.gameStatusElement = document.getElementById('game-status');
        this.difficultySelect = document.getElementById('difficulty');
        this.newGameButton = document.getElementById('new-game');
    }

    bindEvents() {
        this.newGameButton.addEventListener('click', () => this.newGame());
        this.difficultySelect.addEventListener('change', () => this.newGame());
    }

    newGame() {
        const difficulty = this.difficulties[this.difficultySelect.value];
        this.rows = difficulty.rows;
        this.cols = difficulty.cols;
        this.minesCount = difficulty.mines;
        this.flagsCount = 0;
        this.revealedCount = 0;
        this.gameOver = false;
        this.gameWon = false;
        this.leftMouseDown = false;
        this.rightMouseDown = false;
        this.chordHandled = new Set();
        this.firstClick = true;
        this.timer = 0;

        this.stopTimer();
        this.updateTimerDisplay();
        this.updateMinesDisplay();
        this.updateStatus('Игра', '');

        this.createBoard();
        this.renderBoard();
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

        this.gameBoard.addEventListener('contextmenu', (e) => e.preventDefault());

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

        if (flaggedNeighbors !== cell.neighborMines) return;

        this.chordHandled.add(key);

        let hitMine = false;
        for (const n of neighbors) {
            const neighbor = this.board[n.row][n.col];
            if (!neighbor.isRevealed && !neighbor.isFlagged) {
                this.revealCell(n.row, n.col);
                if (neighbor.isMine) {
                    hitMine = true;
                }
            }
        }

        if (hitMine) {
            this.endGame(false);
        } else {
            this.checkWin();
        }
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

        this.revealCell(row, col);

        if (this.board[row][col].isMine) {
            this.endGame(false);
        } else {
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

        if (cell.isMine) {
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