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

- [x] **1.3 — Wire up Hot-Seat move input and rule enforcement**
  - Depends on: 1.1, 1.2
  - Files: `public/hotseat.js` (new), `public/app.js` (new), `public/board.js`
  - Definition of done: clicking a piece highlights only its legal
    destination squares; clicking a legal square moves the piece and hands
    the turn to the other player; no illegal move can be made through the
    UI; castling, en passant, and promotion (with a piece-choice prompt) all
    work by clicking. ✅ Done. `board.js` now takes click handlers and
    highlight state; `hotseat.js` holds the click-to-select/click-to-move
    state machine and shows an on-screen promotion picker (labelled with
    the same D&D-class names as the pieces) when a pawn reaches the last
    rank; `app.js` boots it on page load. A "White/Black to move" status
    line was added too — a bare minimum so two people sharing one screen
    know whose turn it is, not the full check/checkmate banner (that's
    1.4). Verified with 17 automated clicks-in-a-real-browser checks:
    legal-move highlighting, a full move + turn switch, two illegal-click
    scenarios (blocked piece, re-clicking to deselect), kingside castling,
    an en passant capture, and a full promotion flow ending with a pawn
    turning into a Queen via the on-screen "Sorceress" button — zero
    console errors throughout. One test-writing mistake caught along the
    way (not a code bug): my first castling test tried `Bc4` before
    moving the `e2` pawn, which the engine correctly rejected since the
    diagonal was still blocked — fixed the test sequence, not the code.

- [x] **1.4 — Check, checkmate, and stalemate feedback**
  - Depends on: 1.3
  - Files: `public/hotseat.js`, `public/board.js`, `public/index.html`
  - Definition of done: a king in check is visibly flagged; checkmate or
    stalemate ends the game with an on-screen banner naming the winner (or
    declaring a draw); a "New Game" button resets to a fresh Hot-Seat game.
    ✅ Done. `rules.js` gained one small helper, `getKingSquare`, so the UI
    can find which square to flag; `board.js` now highlights that square
    with an orange glow whenever its side is in check. `hotseat.js`
    checks the game status after every move: on checkmate/stalemate the
    status line becomes a bold banner ("Checkmate — White wins!" /
    "Stalemate — draw") and the board stops accepting clicks; a "New
    Game" button (added to `index.html`) resets everything. Verified with
    10 automated in-browser checks: a full scholar's-mate reaching the
    banner and the correct winner text, the checkmated king glowing, the
    board refusing further clicks, and "New Game" fully resetting the
    board, status text, and interactivity — zero console errors. A
    screenshot confirms the banner and king-glow look right together.
    The stalemate *text* branch is new UI code but reuses the exact same
    `getGameStatus` result already proven against a real stalemate
    position back in task 1.1, so it wasn't re-tested against a fresh
    board position here — only the wiring around it is new.

- [x] **1.5 — Landing screen with mode selection**
  - Depends on: 1.4
  - Files: `public/index.html`, `public/app.js`, `public/styles.css`
  - Definition of done: the page opens on a start screen with three buttons
    (Hot-Seat, VS Computer, Online); Hot-Seat is fully playable; VS Computer
    and Online are visible but marked "coming soon" until their phases are
    done. ✅ Done. `index.html` now has a `#menu` section (three mode
    buttons) and a `#game` section (the board, shown/hidden by a `.hidden`
    CSS class); `app.js` owns navigation between them and calls into
    `hotseat.js`'s new `reset()` return value both for "Hot-Seat" from the
    menu and "New Game" inside the game, so re-entering Hot-Seat always
    starts a fresh game. VS Computer and Online are disabled buttons
    labeled "Coming soon". Verified with 16 automated in-browser checks —
    including that leaving mid-game via "Back to Menu" and re-entering
    Hot-Seat gives a genuinely fresh board, not the abandoned one — plus a
    screenshot of the landing screen. One real bug caught in testing: the
    `.hidden { display: none }` CSS rule was declared *before*
    `.menu, .game { display: flex }` in the stylesheet, so on equal CSS
    specificity the later rule silently won and nothing ever actually
    hid — reordered the rules to fix it.

- [x] **1.6 — First live deployment** 🚀
  - Depends on: 1.5
  - Files: `wrangler.jsonc`, `package.json` (no code changes expected —
    this task is a one-time account setup)
  - Deploy method: **Cloudflare Git integration** ("Workers Builds"),
    not the command-line `wrangler deploy`. This cloud session's network
    is blocked from reaching Cloudflare's own servers by its network
    policy, and it can't run a browser-based `wrangler login` either, so
    the human owner connects Cloudflare to GitHub once, by clicking
    through Cloudflare's dashboard — no terminal involved. From then on,
    every push to `main` auto-deploys. Setup (human-only, one time):
    1. Log into dash.cloudflare.com.
    2. Workers & Pages → Create → Import a repository.
    3. Authorize Cloudflare's GitHub App for `YankunZhang27/DND-Chess`.
    4. Select the `main` branch; leave Build command empty and Deploy
       command as its default (`npx wrangler deploy`).
    5. Save and Deploy.
  - Definition of done: Cloudflare's dashboard shows a successful deploy
    of `DND-Chess` and prints a `*.workers.dev` URL. That URL is visited
    in a browser and two people can play a full game of Hot-Seat chess,
    start to finish, live on the internet. ✅ Done. Live at
    https://dnd-chess.yankunzhang.workers.dev/ — this cloud session's own
    network policy blocks it from reaching `*.workers.dev` too, so it
    couldn't be verified automatically from here; the site owner
    confirmed manually that Hot-Seat is playable end to end (a move as
    each side, a full game reaching checkmate, and New Game resetting
    correctly). **Hot-Seat chess is now live on the internet — Phase 1
    is complete.**

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
    on the landing screen; the commit is pushed to `main`, which
    auto-deploys via the Cloudflare Git integration set up in 1.6 (no
    manual deploy step needed); the mode is confirmed playable on the
    live `*.workers.dev` URL once the deploy finishes.

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
    the commit is pushed to `main` and auto-deploys via the Cloudflare Git
    integration; two separate devices/browsers are confirmed able to play
    a full game together live on the internet using a room code.

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

🎉 **Phase 1 is complete.** Hot-Seat chess is live at
https://dnd-chess.yankunzhang.workers.dev/, deployed automatically via
Cloudflare's Git integration — every future push to `main` redeploys on
its own, so tasks 2.4 and 3.6 won't need a separate manual deploy step.

Phase 2 (the computer opponent) starts next. Tell me which task number
to begin with — the recommended next task is **2.1** (the board scoring
function), the first building block the computer opponent's move
search will depend on.
