// Obfuscated Mine Map
const encodedMineMap = "W1swLDAsMCwwLDAsMCwwLDBdLFswLDAsMCwwLDAsMCwwLDBdLFswLDAsMCwiQSIsMCwwLDAsMF0sWzAsIlgiLDAsMCwwLCJFIiwiTiIsMF0sWzAsMCwwLCJTIiwwLDAsMCwwXSxbIk0iLCJBIiwwLDAsMCwiUyIsMCwwXSxbMCwwLCJIIiwwLDAsMCwiUyIsMF0sWzAsMCwwLDAsMCwwLDAsMF0sWzAsMCwiTyIsMCwwLCJKIiwwLDBdLFswLDAsMCwwLDAsMCwiTyIsMF0sWzAsMCwwLDAsMCwwLDAsMF0sWzAsMCwwLDAsMCwwLDAsMF1d";
const mineMap = JSON.parse(atob(encodedMineMap));

// Persistent variables
let clickMode = 'reveal';
let timeRemaining = 180; 
let hintInterval = null;
let puzzleSolved = false; 

// Modal Logic References
const congratsModal = document.getElementById("congratsModal");
const hintModal = document.getElementById("hintModal");
const closeCongratsBtn = document.getElementById("closeCongrats");
const closeHintBtn = document.getElementById("closeHint");
const viewCongratsBtn = document.getElementById("viewCongratsBtn");

function setMode(mode) {
    clickMode = mode;
    document.getElementById('reveal-mode').classList.toggle('active', mode === 'reveal');
    document.getElementById('flag-mode').classList.toggle('active', mode === 'flag');
}

function showHint() {
    hintModal.style.display = "block";
}

function transformTimerToButton() {
    const display = document.getElementById('hint-timer');
    display.innerHTML = `<button id="hint-button" style="cursor:pointer; padding: 2px 5px;">View Hint</button>`;
    document.getElementById('hint-button').addEventListener('click', showHint);
}

function startPersistentTimer() {
    if (hintInterval) return; 
    const display = document.getElementById('hint-timer');

    hintInterval = setInterval(() => {
        if (timeRemaining <= 0) {
            clearInterval(hintInterval);
            if (!puzzleSolved) {
                showHint();
            }
            transformTimerToButton();
            return;
        }
        timeRemaining--;
        let mins = Math.floor(timeRemaining / 60);
        let secs = timeRemaining % 60;
        display.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    const congratsModal = document.getElementById("congratsModal");
    const hintModal = document.getElementById("hintModal");
    const closeCongratsBtn = document.getElementById("closeCongrats");
    const closeHintBtn = document.getElementById("closeHint");
    const viewCongratsBtn = document.getElementById("viewCongratsBtn");

    if (closeCongratsBtn) closeCongratsBtn.onclick = () => { congratsModal.style.display = "none"; }
    if (closeHintBtn) closeHintBtn.onclick = () => { hintModal.style.display = "none"; }
    window.onclick = (event) => {
        if (event.target == congratsModal) congratsModal.style.display = "none";
        if (event.target == hintModal) hintModal.style.display = "none";
    }
    if (viewCongratsBtn) viewCongratsBtn.onclick = () => { congratsModal.style.display = "block"; }

    startPersistentTimer();
    startNewGame();
});

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
                    cell.classList.remove('flagged');
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
        mineCell.classList.add('mine');
        document.getElementById('restart-btn').style.display = 'block';
        setTimeout(() => alert("🔥BURNING THE STONE! Start over."), 10);
    }

    triggerWin() {
        this.gameOver = true;
        puzzleSolved = true; 
        if (hintInterval) {
            clearInterval(hintInterval);
            timeRemaining = 0; 
            transformTimerToButton(); 
        }
        const congratsModal = document.getElementById("congratsModal");
        const viewCongratsBtn = document.getElementById("viewCongratsBtn");
        if (congratsModal) congratsModal.style.display = "block";
        if (viewCongratsBtn) viewCongratsBtn.style.display = "inline-block";
    }
}

let activeGame;
function startNewGame() {
    document.getElementById('restart-btn').style.display = 'none';
    activeGame = new Minesweeper(mineMap);
}

const congratsBase64 = "PGgyPkNvbmdyYXR1bGF0aW9ucyE8L2gyPgogICAgICAgICAgICA8cD5WaWN0b3J5ISBVbnNjcmFtYmxlIHRoZSBtaW5lIGZpZWxkIHRvIGtub3cgd2hlcmUgdG8gZ28gbmV4dC48L3A+";
const hintBase64 = "PGgyPkhpbnQ8L2gyPgogICAgICAgICAgICA8cD5UaGUgbWVkYWwgaXMgb24gdGhlIGxpbmU7IGdldCBib2xkIGZvciB0aGUgZ29sZC4gUnVuIHRoZSBnYW1lIG9uIGFub3RoZXIgcGhvbmUuPC9wPg==";
document.getElementById('congratsContent').innerHTML = atob(congratsBase64);
document.getElementById('hintContent').innerHTML = atob(hintBase64);