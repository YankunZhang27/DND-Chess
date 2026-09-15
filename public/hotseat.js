import { createGameController } from "./game-controller.js";

export function startHotSeatGame(boardEl, statusEl) {
	return createGameController(boardEl, statusEl);
}
