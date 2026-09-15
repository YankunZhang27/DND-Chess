import { createInitialGameState, squareToCoords, getLegalMoves, applyMove } from "./rules.js";
import { renderBoard } from "./board.js";

const PROMOTION_CHOICES = [
	{ type: "q", label: "Sorceress" },
	{ type: "r", label: "Fighter" },
	{ type: "b", label: "Cleric" },
	{ type: "n", label: "Ranger" },
];

export function startHotSeatGame(boardEl, statusEl) {
	let state = createInitialGameState();
	let selectedSquare = null;
	let legalMoves = [];

	function pieceAt(square) {
		const { row, col } = squareToCoords(square);
		return state.board[row][col];
	}

	function selectSquare(square) {
		selectedSquare = square;
		legalMoves = getLegalMoves(state, square);
	}

	function clearSelection() {
		selectedSquare = null;
		legalMoves = [];
	}

	function render() {
		renderBoard(boardEl, state, {
			selectedSquare,
			legalTargets: legalMoves.map((m) => m.to),
			onSquareClick: handleSquareClick,
		});
		if (statusEl) {
			statusEl.textContent = `${state.turn === "w" ? "White" : "Black"} to move`;
		}
	}

	function finalizeMove(to, promotionChoice) {
		const result = applyMove(state, selectedSquare, to, promotionChoice || undefined);
		if (result.ok) state = result.state;
		clearSelection();
		render();
	}

	function completeMove(move) {
		const needsPromotion = legalMoves.some((m) => m.to === move.to && m.promotion);
		if (needsPromotion) {
			showPromotionPicker(state.turn, (choice) => finalizeMove(move.to, choice));
		} else {
			finalizeMove(move.to, null);
		}
	}

	function handleSquareClick(square) {
		if (square === selectedSquare) {
			clearSelection();
			render();
			return;
		}

		if (selectedSquare) {
			const move = legalMoves.find((m) => m.to === square);
			if (move) {
				completeMove(move);
				return;
			}
		}

		const piece = pieceAt(square);
		if (piece && piece.color === state.turn) {
			selectSquare(square);
		} else {
			clearSelection();
		}
		render();
	}

	render();
}

function showPromotionPicker(color, onChoose) {
	const overlay = document.createElement("div");
	overlay.className = "promotion-overlay";

	const panel = document.createElement("div");
	panel.className = "promotion-panel";

	const title = document.createElement("p");
	title.textContent = `${color === "w" ? "White" : "Black"}: choose your promotion`;
	panel.appendChild(title);

	for (const choice of PROMOTION_CHOICES) {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "promotion-choice";
		button.textContent = choice.label;
		button.addEventListener("click", () => {
			overlay.remove();
			onChoose(choice.type);
		});
		panel.appendChild(button);
	}

	overlay.appendChild(panel);
	document.body.appendChild(overlay);
}
