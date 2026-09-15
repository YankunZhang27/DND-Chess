import { coordsToSquare } from "./rules.js";
import { PIECE_PATHS, PIECE_CLASS_NAMES } from "./piece-art.js";

const SVG_NS = "http://www.w3.org/2000/svg";

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
				const svg = document.createElementNS(SVG_NS, "svg");
				svg.setAttribute("viewBox", "0 0 100 100");
				svg.setAttribute("class", `piece piece-${piece.color}`);
				svg.innerHTML = PIECE_PATHS[piece.type];

				const title = document.createElementNS(SVG_NS, "title");
				const side = piece.color === "w" ? "White" : "Black";
				title.textContent = `${side} ${PIECE_CLASS_NAMES[piece.type]}`;
				svg.prepend(title);

				squareEl.appendChild(svg);
			}

			container.appendChild(squareEl);
		}
	}
}
