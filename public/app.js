import { startHotSeatGame } from "./hotseat.js";
import { startVsComputerGame } from "./vscomputer.js";
import { startOnlineGame } from "./online.js";

const menuEl = document.getElementById("menu");
const onlineSetupEl = document.getElementById("online-setup");
const gameEl = document.getElementById("game");

const hotseatBtn = document.getElementById("mode-hotseat");
const vsComputerBtn = document.getElementById("mode-vscomputer");
const onlineBtn = document.getElementById("mode-online");

const onlineNameInput = document.getElementById("online-name");
const onlineCodeInput = document.getElementById("online-code");
const onlineCreateBtn = document.getElementById("online-create");
const onlineJoinBtn = document.getElementById("online-join");
const onlineSetupBackBtn = document.getElementById("online-setup-back");
const onlineSetupError = document.getElementById("online-setup-error");
const onlineInfoEl = document.getElementById("online-info");

const newGameBtn = document.getElementById("new-game");
const backBtn = document.getElementById("back-to-menu");

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");

let currentRoomCode = null;

function updateOnlineInfo(players) {
	const w = players?.w?.name || "(waiting)";
	const b = players?.b?.name || "(waiting)";
	onlineInfoEl.textContent = `Room ${currentRoomCode} — White: ${w} · Black: ${b}`;
}

const hotseat = startHotSeatGame(boardEl, statusEl);
const vsComputer = startVsComputerGame(boardEl, statusEl);
const online = startOnlineGame(boardEl, statusEl, {
	onJoined: (payload) => {
		onlineSetupError.textContent = "";
		newGameBtn.classList.add("hidden");
		onlineInfoEl.classList.remove("hidden");
		updateOnlineInfo(payload.players);
		showGame();
	},
	onPlayers: (players) => updateOnlineInfo(players),
	onJoinFailed: () => {
		onlineSetupError.textContent = "Couldn't join that room — it may be full, or the code may be wrong.";
	},
	onDisconnected: () => {
		onlineInfoEl.textContent = `Room ${currentRoomCode} — disconnected.`;
	},
	onGameError: (message) => {
		statusEl.textContent = message;
	},
});

let activeMode = hotseat;

function showGame() {
	menuEl.classList.add("hidden");
	onlineSetupEl.classList.add("hidden");
	gameEl.classList.remove("hidden");
}

function showMenu() {
	gameEl.classList.add("hidden");
	onlineSetupEl.classList.add("hidden");
	menuEl.classList.remove("hidden");
}

function showOnlineSetup() {
	menuEl.classList.add("hidden");
	gameEl.classList.add("hidden");
	onlineSetupEl.classList.remove("hidden");
	onlineSetupError.textContent = "";
}

function generateRoomCode() {
	const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I — easy to read aloud
	let code = "";
	for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
	return code;
}

hotseatBtn.addEventListener("click", () => {
	activeMode = hotseat;
	newGameBtn.classList.remove("hidden");
	onlineInfoEl.classList.add("hidden");
	hotseat.reset();
	showGame();
});

vsComputerBtn.addEventListener("click", () => {
	activeMode = vsComputer;
	newGameBtn.classList.remove("hidden");
	onlineInfoEl.classList.add("hidden");
	vsComputer.reset();
	showGame();
});

onlineBtn.addEventListener("click", () => {
	activeMode = online;
	showOnlineSetup();
});

onlineSetupBackBtn.addEventListener("click", showMenu);

onlineCreateBtn.addEventListener("click", () => {
	const name = onlineNameInput.value.trim() || "Player";
	currentRoomCode = generateRoomCode();
	online.connect(currentRoomCode, name);
});

onlineJoinBtn.addEventListener("click", () => {
	const name = onlineNameInput.value.trim() || "Player";
	const code = onlineCodeInput.value.trim().toUpperCase();
	if (!code) {
		onlineSetupError.textContent = "Enter a room code to join.";
		return;
	}
	currentRoomCode = code;
	online.connect(currentRoomCode, name);
});

newGameBtn.addEventListener("click", () => activeMode.reset?.());

backBtn.addEventListener("click", () => {
	if (activeMode === online) online.disconnect();
	showMenu();
});
