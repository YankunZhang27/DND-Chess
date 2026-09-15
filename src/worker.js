export { GameRoom } from "./room.js";

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const match = url.pathname.match(/^\/api\/room\/([^/]+)$/);
		if (match) {
			const roomCode = decodeURIComponent(match[1]);
			const stub = env.ROOM.getByName(roomCode);
			return stub.fetch(request);
		}
		return env.ASSETS.fetch(request);
	},
};
