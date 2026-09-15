import {
	createInitialGameState,
	squareToCoords,
	getLegalMoves,
	applyMove,
	getGameStatus,
	getKingSquare,
} from "./rules.js";
import { renderBoard } from "./board.js";

const PROMOTION_CHOICES = [
	{ type: "q", label: "Sorceress" },
	{ type: "r", label: "Paladin" },
	{ type: "b", label: "Wizard" },
	{ type: "n", label: "Ranger" },
];

const DEFAULT_SIDE_NAMES = { w: "White", b: "Black" };

// Shared click-to-select / click-to-move engine used by every mode
// (Hot-Seat, VS Computer, and later Online). `humanColor` restricts which
// side the board will accept clicks for (null means both sides are
// human-controlled, as in Hot-Seat). `onMoveApplied` fires after any move
// — human or programmatic — so a mode can react, e.g. VS Computer
// triggering its own reply once it becomes the computer's turn.
export function createGameController(boardEl, statusEl, options = {}) {
	const { onMoveApplied, onAttemptMove, sideNames = DEFAULT_SIDE_NAMES } = options;

	let humanColor = options.humanColor ?? null;
	let state;
	let selectedSquare;
	let legalMoves;

	function nameFor(color) {
		return sideNames[color] || DEFAULT_SIDE_NAMES[color];
	}

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

	function resetGame() {
		state = createInitialGameState();
		clearSelection();
		render();
	}

	function render() {
		const status = getGameStatus(state);
		const gameOver = status === "checkmate" || status === "stalemate";
		const isHumanTurn = !humanColor || state.turn === humanColor;
		const sideToMove = nameFor(state.turn);
		const checkSquare = status === "check" || status === "checkmate"
			? getKingSquare(state, state.turn)
			: null;

		renderBoard(boardEl, state, {
			selectedSquare,
			legalTargets: legalMoves.map((m) => m.to),
			checkSquare,
			onSquareClick: gameOver || !isHumanTurn ? undefined : handleSquareClick,
		});

		if (statusEl) {
			if (status === "checkmate") {
				const winner = nameFor(state.turn === "w" ? "b" : "w");
				statusEl.textContent = `Checkmate — ${winner} wins!`;
			} else if (status === "stalemate") {
				statusEl.textContent = "Stalemate — draw";
			} else if (status === "check") {
				statusEl.textContent = `${sideToMove} to move — Check!`;
			} else {
				statusEl.textContent = `${sideToMove} to move`;
			}
			statusEl.classList.toggle("game-over", gameOver);
		}
	}

	function setState(newState) {
		state = newState;
		clearSelection();
		render();
		if (onMoveApplied) onMoveApplied(state);
	}

	function applyExternalMove(from, to, promotionChoice) {
		const result = applyMove(state, from, to, promotionChoice || undefined);
		if (result.ok) setState(result.state);
		return result;
	}

	function requestMove(from, to, promotionChoice) {
		if (onAttemptMove) {
			// Server-authoritative modes (Online): don't touch local state.
			// The board updates only once the server broadcasts the result.
			onAttemptMove(from, to, promotionChoice);
			clearSelection();
			render();
		} else {
			applyExternalMove(from, to, promotionChoice);
		}
	}

	function completeMove(move) {
		const needsPromotion = legalMoves.some((m) => m.to === move.to && m.promotion);
		if (needsPromotion) {
			showPromotionPicker(nameFor(state.turn), (choice) => requestMove(selectedSquare, move.to, choice));
		} else {
			requestMove(selectedSquare, move.to, null);
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

	function syncState(newState) {
		// Adopt a state that's already been validated elsewhere (the
		// server, in Online mode) without re-running rules.applyMove.
		state = newState;
		clearSelection();
		render();
	}

	function setHumanColor(color) {
		humanColor = color;
		render();
	}

	resetGame();

	return {
		reset: resetGame,
		getState: () => state,
		applyExternalMove,
		syncState,
		setHumanColor,
	};
}

function showPromotionPicker(sideName, onChoose) {
	const overlay = document.createElement("div");
	overlay.className = "promotion-overlay";

	const panel = document.createElement("div");
	panel.className = "promotion-panel";

	const title = document.createElement("p");
	title.textContent = `${sideName}: choose your promotion`;
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
