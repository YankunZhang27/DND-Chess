import { startHotSeatGame } from "./hotseat.js";

const menuEl = document.getElementById("menu");
const gameEl = document.getElementById("game");
const hotseatBtn = document.getElementById("mode-hotseat");
const newGameBtn = document.getElementById("new-game");
const backBtn = document.getElementById("back-to-menu");

const hotseat = startHotSeatGame(
	document.getElementById("board"),
	document.getElementById("status"),
);

function showGame() {
	menuEl.classList.add("hidden");
	gameEl.classList.remove("hidden");
}

function showMenu() {
	gameEl.classList.add("hidden");
	menuEl.classList.remove("hidden");
}

hotseatBtn.addEventListener("click", () => {
	hotseat.reset();
	showGame();
});

newGameBtn.addEventListener("click", () => hotseat.reset());
backBtn.addEventListener("click", showMenu);
