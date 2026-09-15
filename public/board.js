import { coordsToSquare } from "./rules.js";

const PIECE_SYMBOLS = {
	w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
	b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};

// Placeholder D&D-class skin for each piece type — swap for real names/art
// once Figma screens are available (see ProductSpec.md §1).
const PIECE_CLASS_NAMES = {
	k: "King",
	q: "Sorceress",
	r: "Fighter",
	b: "Cleric",
	n: "Ranger",
	p: "Militia",
};

export function renderBoard(container, gameState, options = {}) {
	const { selectedSquare = null, legalTargets = [], checkSquare = null, onSquareClick } = options;

	container.innerHTML = "";
	for (let row = 0; row < 8; row++) {
		for (let col = 0; col < 8; col++) {
			const square = coordsToSquare(row, col);
			const squareEl = document.createElement("div");
			squareEl.className = `square ${(row + col) % 2 === 0 ? "light" : "dark"}`;
			squareEl.dataset.square = square;

			if (square === selectedSquare) squareEl.classList.add("selected");
			if (legalTargets.includes(square)) squareEl.classList.add("legal-target");
			if (square === checkSquare) squareEl.classList.add("in-check");
			if (onSquareClick) {
				squareEl.classList.add("clickable");
				squareEl.addEventListener("click", () => onSquareClick(square));
			}

			const piece = gameState.board[row][col];
			if (piece) {
				const pieceEl = document.createElement("span");
				pieceEl.className = `piece piece-${piece.color}`;
				pieceEl.textContent = PIECE_SYMBOLS[piece.color][piece.type];
				const side = piece.color === "w" ? "White" : "Black";
				pieceEl.title = `${side} ${PIECE_CLASS_NAMES[piece.type]}`;
				squareEl.appendChild(pieceEl);
			}

			container.appendChild(squareEl);
		}
	}
}
