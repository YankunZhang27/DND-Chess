# Feature Roadmap / Workplan — D&D Chess

How to use this file: every task is a checkbox. A task is only checked off
once its "Definition of done" is fully true. Tasks list what they depend on
(must be checked off first) and exactly which files they touch, so work can
stop after any task and pick back up later — by anyone, or by a fresh Claude
Code session — just by reading which boxes are checked and opening the
files named in the next unchecked task.

**Build order is deliberate:** Phase 1 (Hot-Seat) ships to a live,
public Cloudflare URL before Phase 2 (VS Computer) starts, and Phase 2 ships
live before Phase 3 (Online) starts. At every phase boundary there is a
working, deployed game — never a half-built one.

---

## Phase 0 — Project setup

- [x] **0.1 — Create the GitHub repository and push an initial commit**
  - Depends on: nothing
  - Files: (repository creation, `.gitignore`)
  - Definition of done: `YankunZhang27/DND-Chess` exists on GitHub with at
    least one commit on `main`. ✅ Done.

- [x] **0.2 — Write the three planning documents**
  - Depends on: 0.1
  - Files: `README.md`, `ProductSpec.md`, `FEATUREROADMAP_workplan.md`
  - Definition of done: all three files exist, committed and pushed, and
    describe the app, its architecture, and this build order. ✅ Done (this
    commit).

- [x] **0.3 — Scaffold the Cloudflare Workers project**
  - Depends on: 0.2
  - Files: `wrangler.jsonc` (new), `package.json` (new), `public/index.html`
    (new, placeholder), `src/worker.js` (new, placeholder)
  - Definition of done: `wrangler.jsonc` sets `compatibility_date` to the
    date this task is done, `"observability": {"enabled": true}`, and an
    `"assets"` block pointing at `public/` with
    `"not_found_handling": "single-page-application"`. `npm install` then
    `npm run dev` starts a local server that serves a blank placeholder page
    with no errors in the browser console or terminal. ✅ Done. Note:
    Wrangler had to be pinned to `^4.132.0` — the initially installed
    `^3.90.0` doesn't understand a 2026 compatibility date and silently
    falls back to an older one, which would have violated the "set
    compatibility_date to today's date" requirement.

---

## Phase 1 — Hot-Seat mode (ships live first)

- [x] **1.1 — Build the chess rules engine**
  - Depends on: 0.3
  - Files: `public/rules.js` (new)
  - Definition of done: a single hand-written module (no chess library)
    exporting functions to create the starting position, list legal moves
    for a given square (covering all six piece types, turn order, castling,
    en passant, and promotion), apply a move, and detect check, checkmate,
    and stalemate. Verified by manually running through the test positions
    listed in this task's PR description (e.g. scholar's mate, a legal en
    passant capture, a legal castle, a promotion) in the browser console
    before moving on. ✅ Done. Verified with a temporary Node test script
    (not committed — it isn't part of the app) covering: the initial
    position has exactly 20 legal moves; a full scholar's-mate sequence
    ends in checkmate; illegal moves are rejected; en passant is offered
    and executed correctly; kingside castling moves both the king and
    rook and clears castling rights; a pawn reaching the last rank can
    promote to any of the four pieces; a known stalemate position is
    correctly detected as a draw with no legal moves. One real bug was
    caught and fixed along the way: `getLegalMoves` was silently dropping
    the "this pawn just moved two squares" flag, which meant en passant
    could never actually trigger — fixed by carrying that flag through to
    `applyMove`.

- [x] **1.2 — Render the board and pieces**
  - Depends on: 1.1
  - Files: `public/index.html`, `public/styles.css` (new), `public/board.js`
    (new)
  - Definition of done: loading the page shows a full chess board in the
    starting position, with each piece shown using its D&D-class theme
    (placeholder art/labels if Figma screens aren't available yet — see
    `ProductSpec.md` §1). ✅ Done. `board.js` draws the 64 squares and 32
    pieces straight from `rules.js`'s starting position, using Unicode
    chess glyphs whose hover tooltip shows the placeholder D&D-class name
    (e.g. "White Cleric" for a Bishop) until real art/Figma is available.
    Verified in an actual headless browser (not just reading the HTML):
    confirmed 64 squares and 32 pieces render, zero console errors, and a
    screenshot confirms correct board orientation and coloring (Black on
    rank 8 at top, White on rank 1 at bottom, `a1` dark / `h1` light, per
    standard chess convention).

- [ ] **1.3 — Wire up Hot-Seat move input and rule enforcement**
  - Depends on: 1.1, 1.2
  - Files: `public/hotseat.js` (new), `public/app.js` (new), `public/board.js`
  - Definition of done: clicking a piece highlights only its legal
    destination squares; clicking a legal square moves the piece and hands
    the turn to the other player; no illegal move can be made through the
    UI; castling, en passant, and promotion (with a piece-choice prompt) all
    work by clicking.

- [ ] **1.4 — Check, checkmate, and stalemate feedback**
  - Depends on: 1.3
  - Files: `public/hotseat.js`, `public/board.js`, `public/index.html`
  - Definition of done: a king in check is visibly flagged; checkmate or
    stalemate ends the game with an on-screen banner naming the winner (or
    declaring a draw); a "New Game" button resets to a fresh Hot-Seat game.

- [ ] **1.5 — Landing screen with mode selection**
  - Depends on: 1.4
  - Files: `public/index.html`, `public/app.js`, `public/styles.css`
  - Definition of done: the page opens on a start screen with three buttons
    (Hot-Seat, VS Computer, Online); Hot-Seat is fully playable; VS Computer
    and Online are visible but marked "coming soon" until their phases are
    done.

- [ ] **1.6 — First live deployment** 🚀
  - Depends on: 1.5
  - Files: `wrangler.jsonc`, `package.json`
  - Definition of done: `npx wrangler deploy` succeeds on the Cloudflare
    Workers Free plan. The printed `*.workers.dev` URL is visited in a
    browser and two people can play a full game of Hot-Seat chess,
    start to finish, live on the internet.

---

## Phase 2 — VS Computer mode

- [ ] **2.1 — Board scoring function**
  - Depends on: 1.1
  - Files: `public/ai.js` (new)
  - Definition of done: a function that adds up standard piece values
    (pawn 1, knight/bishop 3, rook 5, queen 9, a large constant for the
    king) for a given board and returns a single number, positive when
    White is ahead.

- [ ] **2.2 — Minimax with alpha-beta pruning (depth 2)**
  - Depends on: 2.1, 1.1
  - Files: `public/ai.js`
  - Definition of done: a function that, given a board and whose turn it
    is, returns a legal move chosen by searching two half-moves ahead with
    alpha-beta pruning, scored by 2.1's function. Timed manually in the
    browser console on a mid-game position and confirmed to return in
    under two seconds.

- [ ] **2.3 — Wire up VS Computer mode**
  - Depends on: 2.2, 1.4
  - Files: `public/vscomputer.js` (new), `public/app.js`
  - Definition of done: selecting VS Computer lets the human play one
    color; after each legal human move, the computer automatically replies
    within two seconds; check/checkmate/stalemate behave exactly as in
    Hot-Seat.

- [ ] **2.4 — Enable VS Computer live and redeploy**
  - Depends on: 2.3
  - Files: `public/app.js`
  - Definition of done: the "coming soon" flag is removed from VS Computer
    on the landing screen; `npx wrangler deploy` is run again; the mode is
    confirmed playable on the live `*.workers.dev` URL.

---

## Phase 3 — Online mode

- [ ] **3.1 — Durable Object skeleton and routing**
  - Depends on: 1.6
  - Files: `src/worker.js`, `src/room.js` (new), `wrangler.jsonc`
  - Definition of done: `wrangler.jsonc` declares one Durable Object class
    (`GameRoom`) bound as `ROOM`, registered under `new_sqlite_classes` in
    the `migrations` array. `worker.js` routes an incoming request to
    `env.ROOM.getByName(roomCode)`. A WebSocket connects successfully using
    `ctx.acceptWebSocket(server)` (not `server.accept()`), confirmed by
    sending a test message from the browser console and seeing it echoed
    back.

- [ ] **3.2 — Room join protocol and player identity**
  - Depends on: 3.1
  - Files: `src/room.js`, `public/online.js` (new)
  - Definition of done: two browser tabs can each connect to the same room
    code with a display name; the Durable Object assigns the first joiner
    White and the second Black, remembering which is which per connection
    using `ws.serializeAttachment()`/`deserializeAttachment()`; a third
    join attempt receives a clear "room full" message instead of being
    seated.

- [ ] **3.3 — Server-side move validation and broadcast**
  - Depends on: 3.2, 1.1
  - Files: `src/room.js` (importing `public/rules.js` directly, so the
    server and browser share the exact same rules module)
  - Definition of done: every `{ "type": "move", "payload": {...} }`
    message is checked against `rules.js` before being applied; legal
    moves update the Durable Object's board and are broadcast to both
    connected players as `{ "type": "state", "payload": {...} }`; illegal
    moves get an error message sent back to the sender only, with no change
    to the game state.

- [ ] **3.4 — Persistence and rejoin after refresh**
  - Depends on: 3.3
  - Files: `src/room.js`
  - Definition of done: the current board and whose turn it is are saved to
    the Durable Object's SQLite storage after every move; refreshing the
    page and reconnecting with the same room code and display name restores
    the game exactly where it left off. No timers, intervals, or Alarms are
    used anywhere in this file.

- [ ] **3.5 — Wire up the Online UI**
  - Depends on: 3.4, 1.4
  - Files: `public/online.js`, `public/app.js`, `public/index.html`
  - Definition of done: from the landing screen, a player can create a room
    (and receive a shareable room code) or join one by entering a code and
    a display name; a move made on one screen appears on the other player's
    screen without a page refresh; check/checkmate/stalemate are shown the
    same way as in Hot-Seat.

- [ ] **3.6 — Enable Online mode live and final redeploy**
  - Depends on: 3.5
  - Files: `public/app.js`
  - Definition of done: the "coming soon" flag is removed from Online mode;
    `npx wrangler deploy` is run again; two separate devices/browsers are
    confirmed able to play a full game together live on the internet using
    a room code.

---

## Phase 4 — Theming and polish (interleaved as time allows, not blocking)

- [ ] **4.1 — Full D&D-class artwork/icon set for all pieces**
  - Depends on: 1.2
  - Files: `public/styles.css`, new image/icon assets under `public/`
  - Definition of done: every piece type on both sides has a distinct,
    finished D&D-class visual, replacing any placeholder used in 1.2.

- [ ] **4.2 — Match Figma screens exactly**
  - Depends on: Figma designs being shared (not yet available — see
    `ProductSpec.md` §1)
  - Files: TBD once Figma is available
  - Definition of done: each screen visually matches its corresponding
    Figma design, or any discrepancy is explicitly flagged back rather than
    silently changed.

- [ ] **4.3 — Mobile/responsive layout pass**
  - Depends on: 1.5
  - Files: `public/styles.css`
  - Definition of done: all three modes are usable on a phone-sized screen
    (board fits without horizontal scrolling, buttons are tappable).

---

## Next step

Phase 0, 1.1, and 1.2 are complete. Tell me which task number to begin
with — the recommended next task is **1.3** (wire up Hot-Seat move input
and rule enforcement), which makes the board on screen actually
clickable and playable.
