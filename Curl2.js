// 1. Define custom mine map (Letters = mine, 0 = empty)
const mineMap = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, "A", 0, 0, 0, 0],
    [0, "H", 0, 0, 0, "M", "S", 0],
    [0, 0, 0, "E", 0, 0, 0, 0],
    ["X", "S", 0, 0, 0, "O", 0, 0],
    [0, 0, "O", 0, 0, 0, "N", 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, "A", 0, 0, "J", 0, 0],
    [0, 0, 0, 0, 0, 0, "S", 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
];

// Persistent variables
let clickMode = 'reveal';
let timeRemaining = 180; 
let hintInterval = null;

function setMode(mode) {
    clickMode = mode;
    document.getElementById('reveal-mode').classList.toggle('active', mode === 'reveal');
    document.getElementById('flag-mode').classList.toggle('active', mode === 'flag');
}

function startPersistentTimer() {
    if (hintInterval) return; 
    const display = document.getElementById('hint-timer');
    hintInterval = setInterval(() => {
        if (timeRemaining <= 0) {
            clearInterval(hintInterval);
            alert("💡 Hint: The medal is on the line; get bold for the gold. Run the game on another phone.");
            return;
        }
        timeRemaining--;
        let mins = Math.floor(timeRemaining / 60);
        let secs = timeRemaining % 60;
        display.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}

class Minesweeper {
    constructor(map) {
        this.map = map;
        this.rows = map.length;
        this.cols = map[0].length;
        this.totalMines = map.flat().filter(x => x !== 0).length;
        this.totalSafeCells = (this.rows * this.cols) - this.totalMines;
        this.flagsPlaced = 0;
        this.revealedCount = 0;
        this.gameOver = false;
        
        this.boardElement = document.getElementById('board');
        this.boardData = this.generateLogic();
        this.render();
        this.updateMineDisplay();
    }

    generateLogic() {
        let logic = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.map[r][c] !== 0) {
                    logic[r][c] = this.map[r][c]; 
                    for (let i = -1; i <= 1; i++) {
                        for (let j = -1; j <= 1; j++) {
                            let nr = r + i, nc = c + j;
                            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && typeof logic[nr][nc] === 'number') {
                                logic[nr][nc]++;
                            }
                        }
                    }
                }
            }
        }
        return logic;
    }

    render() {
        this.boardElement.innerHTML = '';
        // Set exact width for even 313px fit
        this.boardElement.style.gridTemplateColumns = `repeat(${this.cols}, 37.875px)`;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.onclick = () => (clickMode === 'reveal') ? this.reveal(r, c) : this.flag(r, c);
                let timer;
                cell.ontouchstart = (e) => timer = setTimeout(() => this.flag(r, c), 400);
                cell.ontouchend = () => clearTimeout(timer);
                cell.oncontextmenu = (e) => { e.preventDefault(); this.flag(r, c); };
                this.boardElement.appendChild(cell);
            }
        }
    }

    flag(r, c) {
        if (this.gameOver) return;
        const cell = this.boardElement.children[r * this.cols + c];
        if (cell.classList.contains('revealed')) return;
        const isFlagged = cell.classList.toggle('flagged');
        this.flagsPlaced += isFlagged ? 1 : -1;
        this.updateMineDisplay();
    }

    reveal(r, c) {
        if (this.gameOver) return;
        const cell = this.boardElement.children[r * this.cols + c];
        if (cell.classList.contains('revealed') || cell.classList.contains('flagged')) return;

        cell.classList.add('revealed');
        const val = this.boardData[r][c];

        if (typeof val === 'string') {
            // Player hit a mine: Reveal the explosion, but NO LETTERS
            this.triggerGameOver(cell);
        } else {
            this.revealedCount++;
            if (val > 0) {
                cell.innerText = val;
                cell.style.color = ['transparent', 'blue', 'green', 'red', 'darkblue'][val] || 'black';
            } else {
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        let nr = r + i, nc = c + j;
                        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) this.reveal(nr, nc);
                    }
                }
            }
            if (this.revealedCount === this.totalSafeCells) {
                // Victory: NOW reveal the letters
                this.revealAllMines();
                this.triggerWin();
            }
        }
    }

    revealAllMines() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const val = this.boardData[r][c];
                if (typeof val === 'string') {
                    const cell = this.boardElement.children[r * this.cols + c];
                    // Remove flag if present
                    cell.classList.remove('flagged');
                    // Add revealed and special winner styling
                    cell.classList.add('revealed', 'winner');
                    cell.innerText = val; 
                }
            }
        }
    }

    updateMineDisplay() {
        document.getElementById('mine-count').innerText = this.totalMines - this.flagsPlaced;
    }

    triggerGameOver(mineCell) {
        this.gameOver = true;
        mineCell.classList.add('mine'); // Still show red background for the losing cell
        document.getElementById('restart-btn').style.display = 'block';
        setTimeout(() => alert("🔥BURNING THE STONE! Start over."), 10);
    }

    triggerWin() {
        this.gameOver = true;
        // The revealAllMines() call in reveal() handles the text/background change
        setTimeout(() => alert("🪓🎯 Victory! Unscramble the mine field to know where to go next."), 100);
    }
}

let activeGame;
function startNewGame() {
    document.getElementById('restart-btn').style.display = 'none';
    activeGame = new Minesweeper(mineMap);
}

startPersistentTimer();
startNewGame();