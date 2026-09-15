const FILES = "abcdefgh";

// board[row][col]: row 0 is rank 8 (Black's home row), row 7 is rank 1
// (White's home row) — this matches how a board is normally drawn on
// screen, with Black at the top.

export function squareToCoords(square) {
	const col = FILES.indexOf(square[0]);
	const rank = parseInt(square[1], 10);
	const row = 8 - rank;
	return { row, col };
}

export function coordsToSquare(row, col) {
	return `${FILES[col]}${8 - row}`;
}

function inBounds(row, col) {
	return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function cloneBoard(board) {
	return board.map((row) => row.slice());
}

export function createInitialGameState() {
	const backRank = ["r", "n", "b", "q", "k", "b", "n", "r"];
	const board = Array.from({ length: 8 }, () => Array(8).fill(null));
	for (let col = 0; col < 8; col++) {
		board[0][col] = { type: backRank[col], color: "b" };
		board[1][col] = { type: "p", color: "b" };
		board[6][col] = { type: "p", color: "w" };
		board[7][col] = { type: backRank[col], color: "w" };
	}
	return {
		board,
		turn: "w",
		castlingRights: { wK: true, wQ: true, bK: true, bQ: true },
		enPassantTarget: null,
	};
}

function isSquareAttacked(board, row, col, byColor) {
	const pawnRow = byColor === "w" ? row + 1 : row - 1;
	for (const dc of [-1, 1]) {
		if (inBounds(pawnRow, col + dc)) {
			const p = board[pawnRow][col + dc];
			if (p && p.color === byColor && p.type === "p") return true;
		}
	}

	const knightDeltas = [
		[-2, -1], [-2, 1], [-1, -2], [-1, 2],
		[1, -2], [1, 2], [2, -1], [2, 1],
	];
	for (const [dr, dc] of knightDeltas) {
		const r = row + dr, c = col + dc;
		if (inBounds(r, c)) {
			const p = board[r][c];
			if (p && p.color === byColor && p.type === "n") return true;
		}
	}

	for (let dr = -1; dr <= 1; dr++) {
		for (let dc = -1; dc <= 1; dc++) {
			if (dr === 0 && dc === 0) continue;
			const r = row + dr, c = col + dc;
			if (inBounds(r, c)) {
				const p = board[r][c];
				if (p && p.color === byColor && p.type === "k") return true;
			}
		}
	}

	const rookDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
	for (const [dr, dc] of rookDirs) {
		let r = row + dr, c = col + dc;
		while (inBounds(r, c)) {
			const p = board[r][c];
			if (p) {
				if (p.color === byColor && (p.type === "r" || p.type === "q")) return true;
				break;
			}
			r += dr; c += dc;
		}
	}

	const bishopDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
	for (const [dr, dc] of bishopDirs) {
		let r = row + dr, c = col + dc;
		while (inBounds(r, c)) {
			const p = board[r][c];
			if (p) {
				if (p.color === byColor && (p.type === "b" || p.type === "q")) return true;
				break;
			}
			r += dr; c += dc;
		}
	}

	return false;
}

function findKing(board, color) {
	for (let r = 0; r < 8; r++) {
		for (let c = 0; c < 8; c++) {
			const p = board[r][c];
			if (p && p.color === color && p.type === "k") return { row: r, col: c };
		}
	}
	return null;
}

export function getKingSquare(state, color) {
	const king = findKing(state.board, color);
	return king ? coordsToSquare(king.row, king.col) : null;
}

export function isInCheck(state, color) {
	const king = findKing(state.board, color);
	if (!king) return false;
	const enemy = color === "w" ? "b" : "w";
	return isSquareAttacked(state.board, king.row, king.col, enemy);
}

function pseudoLegalMovesForSquare(state, row, col) {
	const { board } = state;
	const piece = board[row][col];
	if (!piece) return [];
	const { color } = piece;
	const enemy = color === "w" ? "b" : "w";
	const moves = [];

	const addSlides = (dirs) => {
		for (const [dr, dc] of dirs) {
			let r = row + dr, c = col + dc;
			while (inBounds(r, c)) {
				const target = board[r][c];
				if (!target) {
					moves.push({ to: { row: r, col: c } });
				} else {
					if (target.color === enemy) moves.push({ to: { row: r, col: c } });
					break;
				}
				r += dr; c += dc;
			}
		}
	};

	if (piece.type === "r") {
		addSlides([[-1, 0], [1, 0], [0, -1], [0, 1]]);
	} else if (piece.type === "b") {
		addSlides([[-1, -1], [-1, 1], [1, -1], [1, 1]]);
	} else if (piece.type === "q") {
		addSlides([[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]);
	} else if (piece.type === "n") {
		const deltas = [
			[-2, -1], [-2, 1], [-1, -2], [-1, 2],
			[1, -2], [1, 2], [2, -1], [2, 1],
		];
		for (const [dr, dc] of deltas) {
			const r = row + dr, c = col + dc;
			if (inBounds(r, c)) {
				const target = board[r][c];
				if (!target || target.color === enemy) moves.push({ to: { row: r, col: c } });
			}
		}
	} else if (piece.type === "k") {
		for (let dr = -1; dr <= 1; dr++) {
			for (let dc = -1; dc <= 1; dc++) {
				if (dr === 0 && dc === 0) continue;
				const r = row + dr, c = col + dc;
				if (inBounds(r, c)) {
					const target = board[r][c];
					if (!target || target.color === enemy) moves.push({ to: { row: r, col: c } });
				}
			}
		}

		const rank = color === "w" ? 7 : 0;
		if (row === rank && col === 4 && !isInCheck(state, color)) {
			const rights = state.castlingRights;
			const kingSide = color === "w" ? rights.wK : rights.bK;
			const queenSide = color === "w" ? rights.wQ : rights.bQ;
			const rookK = board[rank][7];
			const rookQ = board[rank][0];

			if (
				kingSide &&
				rookK && rookK.type === "r" && rookK.color === color &&
				!board[rank][5] && !board[rank][6] &&
				!isSquareAttacked(board, rank, 5, enemy) &&
				!isSquareAttacked(board, rank, 6, enemy)
			) {
				moves.push({ to: { row: rank, col: 6 }, castle: "K" });
			}

			if (
				queenSide &&
				rookQ && rookQ.type === "r" && rookQ.color === color &&
				!board[rank][1] && !board[rank][2] && !board[rank][3] &&
				!isSquareAttacked(board, rank, 3, enemy) &&
				!isSquareAttacked(board, rank, 2, enemy)
			) {
				moves.push({ to: { row: rank, col: 2 }, castle: "Q" });
			}
		}
	} else if (piece.type === "p") {
		const dir = color === "w" ? -1 : 1;
		const startRow = color === "w" ? 6 : 1;
		const promoRow = color === "w" ? 0 : 7;
		const r1 = row + dir;

		if (inBounds(r1, col) && !board[r1][col]) {
			if (r1 === promoRow) {
				for (const promotion of ["q", "r", "b", "n"]) {
					moves.push({ to: { row: r1, col }, promotion });
				}
			} else {
				moves.push({ to: { row: r1, col } });
				const r2 = row + 2 * dir;
				if (row === startRow && !board[r2][col]) {
					moves.push({ to: { row: r2, col }, doubleStep: true });
				}
			}
		}

		for (const dc of [-1, 1]) {
			const c = col + dc;
			if (!inBounds(r1, c)) continue;
			const target = board[r1][c];
			if (target && target.color === enemy) {
				if (r1 === promoRow) {
					for (const promotion of ["q", "r", "b", "n"]) {
						moves.push({ to: { row: r1, col: c }, promotion });
					}
				} else {
					moves.push({ to: { row: r1, col: c } });
				}
			} else if (!target && state.enPassantTarget) {
				const ep = squareToCoords(state.enPassantTarget);
				if (ep.row === r1 && ep.col === c) {
					moves.push({ to: { row: r1, col: c }, enPassant: true });
				}
			}
		}
	}

	return moves;
}

function applyMoveRaw(state, from, moveDesc) {
	const board = cloneBoard(state.board);
	const piece = board[from.row][from.col];
	const { to } = moveDesc;
	let captured = board[to.row][to.col] || null;

	board[from.row][from.col] = null;

	if (moveDesc.enPassant) {
		captured = board[from.row][to.col];
		board[from.row][to.col] = null;
	}

	board[to.row][to.col] = moveDesc.promotion
		? { type: moveDesc.promotion, color: piece.color }
		: piece;

	if (moveDesc.castle) {
		const rank = from.row;
		if (moveDesc.castle === "K") {
			board[rank][5] = board[rank][7];
			board[rank][7] = null;
		} else {
			board[rank][3] = board[rank][0];
			board[rank][0] = null;
		}
	}

	const castlingRights = { ...state.castlingRights };
	if (piece.type === "k") {
		if (piece.color === "w") { castlingRights.wK = false; castlingRights.wQ = false; }
		else { castlingRights.bK = false; castlingRights.bQ = false; }
	}
	const clearRookRight = (row, col) => {
		if (row === 7 && col === 0) castlingRights.wQ = false;
		if (row === 7 && col === 7) castlingRights.wK = false;
		if (row === 0 && col === 0) castlingRights.bQ = false;
		if (row === 0 && col === 7) castlingRights.bK = false;
	};
	if (piece.type === "r") clearRookRight(from.row, from.col);
	if (captured && captured.type === "r") clearRookRight(to.row, to.col);

	let enPassantTarget = null;
	if (moveDesc.doubleStep) {
		const midRow = (from.row + to.row) / 2;
		enPassantTarget = coordsToSquare(midRow, from.col);
	}

	return {
		board,
		turn: state.turn === "w" ? "b" : "w",
		castlingRights,
		enPassantTarget,
		lastMove: { from: coordsToSquare(from.row, from.col), to: coordsToSquare(to.row, to.col) },
	};
}

export function getLegalMoves(state, square) {
	const { row, col } = squareToCoords(square);
	const piece = state.board[row][col];
	if (!piece || piece.color !== state.turn) return [];

	const legal = [];
	for (const move of pseudoLegalMovesForSquare(state, row, col)) {
		const next = applyMoveRaw(state, { row, col }, move);
		if (!isInCheck(next, piece.color)) {
			legal.push({
				from: square,
				to: coordsToSquare(move.to.row, move.to.col),
				promotion: move.promotion || null,
				castle: move.castle || null,
				enPassant: !!move.enPassant,
				doubleStep: !!move.doubleStep,
			});
		}
	}
	return legal;
}

export function getAllLegalMoves(state) {
	const moves = [];
	for (let r = 0; r < 8; r++) {
		for (let c = 0; c < 8; c++) {
			const piece = state.board[r][c];
			if (piece && piece.color === state.turn) {
				moves.push(...getLegalMoves(state, coordsToSquare(r, c)));
			}
		}
	}
	return moves;
}

export function applyMove(state, from, to, promotionChoice) {
	const candidates = getLegalMoves(state, from).filter((m) => m.to === to);
	if (candidates.length === 0) {
		return { ok: false, error: "illegal move" };
	}

	let chosen = candidates[0];
	if (candidates.length > 1 || candidates[0].promotion) {
		chosen = candidates.find((m) => m.promotion === (promotionChoice || "q"));
		if (!chosen) return { ok: false, error: "invalid promotion choice" };
	}

	const { row, col } = squareToCoords(from);
	const moveDesc = {
		to: squareToCoords(to),
		promotion: chosen.promotion || undefined,
		castle: chosen.castle || undefined,
		enPassant: chosen.enPassant || undefined,
		doubleStep: chosen.doubleStep || undefined,
	};
	const nextState = applyMoveRaw(state, { row, col }, moveDesc);
	return { ok: true, state: nextState, move: chosen };
}

export function getGameStatus(state) {
	const inCheck = isInCheck(state, state.turn);
	const hasMoves = getAllLegalMoves(state).length > 0;
	if (inCheck && !hasMoves) return "checkmate";
	if (!inCheck && !hasMoves) return "stalemate";
	if (inCheck) return "check";
	return "normal";
}
