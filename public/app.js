import { startHotSeatGame } from "./hotseat.js";
import { startVsComputerGame } from "./vscomputer.js";

const menuEl = document.getElementById("menu");
const gameEl = document.getElementById("game");
const hotseatBtn = document.getElementById("mode-hotseat");
const vsComputerBtn = document.getElementById("mode-vscomputer");
const newGameBtn = document.getElementById("new-game");
const backBtn = document.getElementById("back-to-menu");

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");

const hotseat = startHotSeatGame(boardEl, statusEl);
const vsComputer = startVsComputerGame(boardEl, statusEl);

let activeMode = hotseat;

function showGame() {
	menuEl.classList.add("hidden");
	gameEl.classList.remove("hidden");
}

function showMenu() {
	gameEl.classList.add("hidden");
	menuEl.classList.remove("hidden");
}

hotseatBtn.addEventListener("click", () => {
	activeMode = hotseat;
	hotseat.reset();
	showGame();
});

vsComputerBtn.addEventListener("click", () => {
	activeMode = vsComputer;
	vsComputer.reset();
	showGame();
});

newGameBtn.addEventListener("click", () => activeMode.reset());
backBtn.addEventListener("click", showMenu);
