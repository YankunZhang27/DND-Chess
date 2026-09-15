import { DurableObject } from "cloudflare:workers";
import { createInitialGameState, applyMove, getGameStatus } from "../public/rules.js";

export class GameRoom extends DurableObject {
	constructor(ctx, env) {
		super(ctx, env);
		this.ctx = ctx;
		ctx.storage.sql.exec(
			"CREATE TABLE IF NOT EXISTS room (id INTEGER PRIMARY KEY CHECK (id = 0), record TEXT NOT NULL)",
		);
	}

	loadRecord() {
		const rows = [...this.ctx.storage.sql.exec("SELECT record FROM room WHERE id = 0")];
		if (rows.length > 0) return JSON.parse(rows[0].record);
		const fresh = { game: createInitialGameState(), roster: { w: null, b: null } };
		this.saveRecord(fresh);
		return fresh;
	}

	saveRecord(record) {
		this.ctx.storage.sql.exec(
			"INSERT INTO room (id, record) VALUES (0, ?) ON CONFLICT(id) DO UPDATE SET record = excluded.record",
			JSON.stringify(record),
		);
	}

	liveColors() {
		const colors = new Set();
		for (const ws of this.ctx.getWebSockets()) {
			const info = ws.deserializeAttachment();
			if (info && info.color) colors.add(info.color);
		}
		return colors;
	}

	resolveColorForJoin(displayName, roster) {
		const live = this.liveColors();
		if (roster.w === displayName && !live.has("w")) return "w";
		if (roster.b === displayName && !live.has("b")) return "b";
		if (!roster.w) return "w";
		if (!roster.b) return "b";
		return null;
	}

	playerSummary(record) {
		const players = { w: record.roster.w, b: record.roster.b };
		const live = this.liveColors();
		return { w: { name: players.w, connected: live.has("w") }, b: { name: players.b, connected: live.has("b") } };
	}

	broadcast(message, exceptWs) {
		const json = JSON.stringify(message);
		for (const ws of this.ctx.getWebSockets()) {
			if (ws !== exceptWs) ws.send(json);
		}
	}

	broadcastPlayers(record) {
		this.broadcast({ type: "players", payload: { players: this.playerSummary(record) } });
	}

	async fetch(request) {
		if (request.headers.get("Upgrade") !== "websocket") {
			return new Response("Expected a WebSocket upgrade", { status: 426 });
		}

		const url = new URL(request.url);
		const displayName = (url.searchParams.get("name") || "Player").slice(0, 40);

		const record = this.loadRecord();
		const color = this.resolveColorForJoin(displayName, record.roster);
		if (!color) {
			return new Response("Room is full", { status: 403 });
		}

		record.roster[color] = displayName;
		this.saveRecord(record);

		const pair = new WebSocketPair();
		const [client, server] = Object.values(pair);

		this.ctx.acceptWebSocket(server);
		server.serializeAttachment({ color, displayName });

		server.send(JSON.stringify({
			type: "joined",
			payload: { color, displayName, state: record.game, players: this.playerSummary(record) },
		}));
		this.broadcastPlayers(record);

		return new Response(null, { status: 101, webSocket: client });
	}

	webSocketMessage(ws, rawMessage) {
		let message;
		try {
			message = JSON.parse(rawMessage);
		} catch {
			ws.send(JSON.stringify({ type: "error", payload: { message: "Malformed message" } }));
			return;
		}

		if (message.type === "move") {
			this.handleMove(ws, message.payload || {});
		}
	}

	handleMove(ws, payload) {
		const info = ws.deserializeAttachment();
		const record = this.loadRecord();

		if (!info || info.color !== record.game.turn) {
			ws.send(JSON.stringify({ type: "error", payload: { message: "Not your turn" } }));
			return;
		}

		const result = applyMove(record.game, payload.from, payload.to, payload.promotion);
		if (!result.ok) {
			ws.send(JSON.stringify({ type: "error", payload: { message: result.error } }));
			return;
		}

		record.game = result.state;
		this.saveRecord(record);

		const status = getGameStatus(result.state);
		this.broadcast({ type: "state", payload: { state: result.state, status } });
	}

	webSocketClose() {
		const record = this.loadRecord();
		this.broadcastPlayers(record);
	}

	webSocketError() {
		const record = this.loadRecord();
		this.broadcastPlayers(record);
	}
}
