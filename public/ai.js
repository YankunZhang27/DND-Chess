import { getAllLegalMoves, applyMove, getGameStatus } from "./rules.js";

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const SEARCH_DEPTH = 2;
const MATE_SCORE = 100000;

export function scoreBoard(board) {
	let score = 0;
	for (let row = 0; row < 8; row++) {
		for (let col = 0; col < 8; col++) {
			const piece = board[row][col];
			if (!piece) continue;
			const value = PIECE_VALUES[piece.type];
			score += piece.color === "w" ? value : -value;
		}
	}
	return score;
}

function evaluate(state, depth, alpha, beta) {
	const status = getGameStatus(state);
	if (status === "checkmate") {
		// The side to move has no way out — very bad for them.
		return state.turn === "w" ? -MATE_SCORE : MATE_SCORE;
	}
	if (status === "stalemate") return 0;
	if (depth === 0) return scoreBoard(state.board);

	const maximizing = state.turn === "w";
	let best = maximizing ? -Infinity : Infinity;

	for (const move of getAllLegalMoves(state)) {
		const result = applyMove(state, move.from, move.to, move.promotion || undefined);
		const score = evaluate(result.state, depth - 1, alpha, beta);

		if (maximizing) {
			best = Math.max(best, score);
			alpha = Math.max(alpha, best);
		} else {
			best = Math.min(best, score);
			beta = Math.min(beta, best);
		}
		if (beta <= alpha) break;
	}

	return best;
}

export function chooseComputerMove(state) {
	const moves = getAllLegalMoves(state);
	if (moves.length === 0) return null;

	const maximizing = state.turn === "w";
	let bestMove = moves[0];
	let bestScore = maximizing ? -Infinity : Infinity;
	let alpha = -Infinity;
	let beta = Infinity;

	for (const move of moves) {
		const result = applyMove(state, move.from, move.to, move.promotion || undefined);
		const score = evaluate(result.state, SEARCH_DEPTH - 1, alpha, beta);

		if (maximizing ? score > bestScore : score < bestScore) {
			bestScore = score;
			bestMove = move;
		}
		if (maximizing) alpha = Math.max(alpha, bestScore);
		else beta = Math.min(beta, bestScore);
	}

	return bestMove;
}
