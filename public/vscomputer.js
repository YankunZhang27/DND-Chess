import { createGameController } from "./game-controller.js";
import { chooseComputerMove } from "./ai.js";

const COMPUTER_COLOR = "b";

export function startVsComputerGame(boardEl, statusEl) {
	const controller = createGameController(boardEl, statusEl, {
		humanColor: "w",
		sideNames: { w: "White (You)", b: "Black (Computer)" },
		onMoveApplied: (state) => {
			if (state.turn !== COMPUTER_COLOR) return;
			const move = chooseComputerMove(state);
			if (move) controller.applyExternalMove(move.from, move.to, move.promotion || undefined);
		},
	});

	return controller;
}
