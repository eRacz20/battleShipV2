const API = "http://localhost:3000";

const enemyBoard = document.getElementById("enemy");
const playerBoard = document.getElementById("player");
const startBtn = document.getElementById("start");
const doubleShotBtn = document.getElementById("double-shot");
const statusText = document.getElementById("status");

const nameInput = document.getElementById("player-name-input");
const playerNameTitle = document.getElementById("player-name-title");

/* ---- Stats Elements ---- */
const shotsFiredEl = document.getElementById("shots-fired");
const hitsEl = document.getElementById("hits");
const missesEl = document.getElementById("misses");
const accuracyEl = document.getElementById("accuracy");

/* ---- Game State ---- */
let shotsRemaining = 1;
let doubleShotUsed = false;
let gameOver = false;

/* ---- Player Stats ---- */
let shotsFired = 0;
let hits = 0;
let misses = 0;

/* ---------- Player Name ---------- */
nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const name = nameInput.value.trim();
        if (name) {
            playerNameTitle.textContent = `${name}'s Fleet`;
            nameInput.blur();
        }
    }
});

/* ---------- Double Shot ---------- */
doubleShotBtn.onclick = () => {
    if (doubleShotUsed) return;

    shotsRemaining = 2;
    doubleShotUsed = true;
    doubleShotBtn.classList.add("used");
    statusText.textContent = "Double Shot activated! Fire twice.";
};

/* ---------- Enemy Board ---------- */
function createEnemyBoard() {
    enemyBoard.innerHTML = "";
    for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
            const cell = document.createElement("div");
            cell.className = "cell enemy-cell";
            cell.onclick = () => attack(r, c, cell);
            enemyBoard.appendChild(cell);
        }
    }
}

/* ---------- Player Board ---------- */
function renderPlayerBoard(board) {
    playerBoard.innerHTML = "";
    board.forEach(row => {
        row.forEach(v => {
            const cell = document.createElement("div");
            cell.className = "cell";
            if (v === 1) cell.classList.add("ship");
            if (v === 2) cell.classList.add("hit");
            if (v === -1) cell.classList.add("miss");
            playerBoard.appendChild(cell);
        });
    });
}

async function updatePlayerBoard() {
    const res = await fetch(`${API}/state`);
    const data = await res.json();
    renderPlayerBoard(data.playerBoard);
}

/* ---------- Stats ---------- */
function updateStats() {
    shotsFiredEl.textContent = shotsFired;
    hitsEl.textContent = hits;
    missesEl.textContent = misses;

    const accuracy =
        shotsFired === 0 ? 0 : Math.round((hits / shotsFired) * 100);
    accuracyEl.textContent = `${accuracy}%`;
}

/* ---------- Game Flow ---------- */
async function startGame() {
    await fetch(`${API}/start`, { method: "POST" });

    shotsRemaining = 1;
    doubleShotUsed = false;
    gameOver = false;

    shotsFired = 0;
    hits = 0;
    misses = 0;
    updateStats();

    doubleShotBtn.classList.remove("used");

    createEnemyBoard();
    updatePlayerBoard();
    statusText.textContent = "Game started! Fire when ready.";
}

async function attack(row, col, cell) {
    if (gameOver) return;
    if (cell.classList.contains("hit") || cell.classList.contains("miss")) return;
    if (shotsRemaining <= 0) return;

    const isLastShot = shotsRemaining === 1;

    const res = await fetch(`${API}/attack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            row,
            col,
            endTurn: isLastShot
        })
    });

    const data = await res.json();

    shotsFired++;

    if (data.hit) {
        hits++;
        cell.classList.add("hit");
    } else {
        misses++;
        cell.classList.add("miss");
    }

    updateStats();

    if (data.winner) {
        gameOver = true;
        statusText.textContent =
            data.winner === "player"
                ? "🎉 You win! All enemy ships sunk."
                : "💀 You lose! Your fleet has been destroyed.";
        updatePlayerBoard();
        return;
    }

    shotsRemaining--;

    if (shotsRemaining === 1 && doubleShotUsed) {
        statusText.textContent = "One shot left!";
    }

    if (shotsRemaining === 0) {
        shotsRemaining = 1;
        statusText.textContent = "Fire when ready.";
        updatePlayerBoard();
    }
}

startBtn.onclick = startGame;
