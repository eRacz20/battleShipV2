const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const GRID = 10;
const SHIPS = [2, 2, 3, 3, 4];

// 0 = empty, 1 = ship, 2 = hit, -1 = miss
function emptyBoard() {
    return Array.from({ length: GRID }, () => Array(GRID).fill(0));
}

function placeShips(board) {
    for (let size of SHIPS) {
        let placed = false;
        while (!placed) {
            const horiz = Math.random() < 0.5;
            const r = Math.floor(Math.random() * GRID);
            const c = Math.floor(Math.random() * GRID);

            if (horiz && c + size <= GRID) {
                if (board[r].slice(c, c + size).every(v => v === 0)) {
                    for (let i = 0; i < size; i++) board[r][c + i] = 1;
                    placed = true;
                }
            }

            if (!horiz && r + size <= GRID) {
                let ok = true;
                for (let i = 0; i < size; i++) {
                    if (board[r + i][c] !== 0) ok = false;
                }
                if (ok) {
                    for (let i = 0; i < size; i++) board[r + i][c] = 1;
                    placed = true;
                }
            }
        }
    }
}

let playerBoard;
let computerBoard;
let computerMoves;

app.post("/start", (req, res) => {
    playerBoard = emptyBoard();
    computerBoard = emptyBoard();
    computerMoves = new Set();

    placeShips(playerBoard);
    placeShips(computerBoard);

    res.json({ message: "Game started" });
});

app.post("/attack", (req, res) => {
    const { row, col, endTurn } = req.body;

    let hit = false;
    if (computerBoard[row][col] === 1) {
        computerBoard[row][col] = 2;
        hit = true;
    } else if (computerBoard[row][col] === 0) {
        computerBoard[row][col] = -1;
    }

    // 🏆 Check if player just won
    const enemyShipsLeft = computerBoard.flat().includes(1);
    if (!enemyShipsLeft) {
        return res.json({ hit, winner: "player" });
    }

    // If player's turn is NOT over, stop here
    if (!endTurn) {
        return res.json({ hit });
    }

    // -------- Computer fires ONCE --------
    let r, c, key;
    do {
        r = Math.floor(Math.random() * GRID);
        c = Math.floor(Math.random() * GRID);
        key = `${r},${c}`;
    } while (computerMoves.has(key));

    computerMoves.add(key);

    let computerHit = false;
    if (playerBoard[r][c] === 1) {
        playerBoard[r][c] = 2;
        computerHit = true;
    } else if (playerBoard[r][c] === 0) {
        playerBoard[r][c] = -1;
    }

    // 🏆 Check if computer just won
    const playerShipsLeft = playerBoard.flat().includes(1);
    if (!playerShipsLeft) {
        return res.json({
            hit,
            computerMove: { hit: computerHit },
            winner: "computer"
        });
    }

    res.json({
        hit,
        computerMove: { hit: computerHit }
    });
});

app.get("/state", (req, res) => {
    res.json({ playerBoard });
});

app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
});
