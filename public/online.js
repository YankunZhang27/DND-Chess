import { createGameController } from "./game-controller.js";

export function startOnlineGame(boardEl, statusEl, callbacks = {}) {
	let socket = null;
	let joined = false;

	const controller = createGameController(boardEl, statusEl, {
		sideNames: { w: "White", b: "Black" },
		onAttemptMove: (from, to, promotionChoice) => {
			if (!socket || socket.readyState !== WebSocket.OPEN) return;
			socket.send(JSON.stringify({
				type: "move",
				payload: { from, to, promotion: promotionChoice || undefined },
			}));
		},
	});

	function connect(roomCode, displayName) {
		disconnect();
		joined = false;

		const protocol = location.protocol === "https:" ? "wss:" : "ws:";
		const url = `${protocol}//${location.host}/api/room/${encodeURIComponent(roomCode)}?name=${encodeURIComponent(displayName)}`;
		socket = new WebSocket(url);

		socket.addEventListener("message", (event) => {
			const message = JSON.parse(event.data);
			if (message.type === "joined") {
				joined = true;
				controller.setHumanColor(message.payload.color);
				controller.syncState(message.payload.state);
				callbacks.onJoined?.(message.payload, roomCode);
			} else if (message.type === "state") {
				controller.syncState(message.payload.state);
			} else if (message.type === "players") {
				callbacks.onPlayers?.(message.payload.players);
			} else if (message.type === "error") {
				callbacks.onGameError?.(message.payload.message);
			}
		});

		socket.addEventListener("close", () => {
			if (!joined) callbacks.onJoinFailed?.();
			else callbacks.onDisconnected?.();
		});
	}

	function disconnect() {
		if (socket) {
			socket.close();
			socket = null;
		}
	}

	return { connect, disconnect };
}
