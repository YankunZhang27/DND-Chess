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

- [x] **2.1 — Board scoring function**
  - Depends on: 1.1
  - Files: `public/ai.js` (new)
  - Definition of done: a function that adds up standard piece values
    (pawn 1, knight/bishop 3, rook 5, queen 9, a large constant for the
    king) for a given board and returns a single number, positive when
    White is ahead. ✅ Done. `scoreBoard` in `public/ai.js`. The king is
    scored 0 rather than a large constant — since both sides always have
    exactly one king in any non-game-over position, a king value would
    always cancel out to zero anyway, so a large constant would be dead
    weight; checkmate is instead detected directly (see 2.2).

- [x] **2.2 — Minimax with alpha-beta pruning (depth 2)**
  - Depends on: 2.1, 1.1
  - Files: `public/ai.js`
  - Definition of done: a function that, given a board and whose turn it
    is, returns a legal move chosen by searching two half-moves ahead with
    alpha-beta pruning, scored by 2.1's function. Timed manually in the
    browser console on a mid-game position and confirmed to return in
    under two seconds. ✅ Done. `chooseComputerMove` in `public/ai.js`.
    Checkmate/stalemate are scored directly as decisive/neutral outcomes
    at any depth (a small, standard addition — without it, "opponent has
    no legal moves" would be scored as an ordinary position instead of a
    win, which isn't a real minimax implementation). Verified with 6
    automated Node tests: correct material scoring, a real timing
    measurement (35ms — far under the 2-second limit, not just "probably
    fine"), the computer capturing an undefended hanging queen, and the
    computer finding and playing an available mate-in-1 instead of a
    weaker move.

- [x] **2.3 — Wire up VS Computer mode**
  - Depends on: 2.2, 1.4
  - Files: `public/vscomputer.js` (new), `public/app.js`
  - Definition of done: selecting VS Computer lets the human play one
    color; after each legal human move, the computer automatically replies
    within two seconds; check/checkmate/stalemate behave exactly as in
    Hot-Seat. ✅ Done, with one structural change beyond the planned file
    list: Hot-Seat and VS Computer share almost all of their click-to-move
    logic (select a piece, highlight legal squares, promotion picker,
    check/checkmate/stalemate display), and Online mode in Phase 3 will
    need the same thing again, so that shared logic was pulled out into a
    new `public/game-controller.js` rather than copy-pasted a second and
    (soon) third time. `hotseat.js` is now a two-line wrapper around it;
    `vscomputer.js` configures it with `humanColor: "w"` (the human is
    always White) and a hook that triggers `ai.js`'s `chooseComputerMove`
    the moment it becomes Black's turn. Verified with 10 automated
    browser checks (including a Hot-Seat regression pass, to make sure
    the refactor didn't break the existing mode) plus a 20-move randomized
    stress game against the computer — zero console errors throughout.

- [x] **2.4 — Enable VS Computer live and redeploy**
  - Depends on: 2.3
  - Files: `public/app.js`
  - Definition of done: the "coming soon" flag is removed from VS Computer
    on the landing screen; the commit is pushed to `main`, which
    auto-deploys via the Cloudflare Git integration set up in 1.6 (no
    manual deploy step needed); the mode is confirmed playable on the
    live `*.workers.dev` URL once the deploy finishes. ✅ Done. Confirmed
    working live by the site owner.

---

## Phase 3 — Online mode

- [x] **3.1 — Durable Object skeleton and routing**
  - Depends on: 1.6
  - Files: `src/worker.js`, `src/room.js` (new), `wrangler.jsonc`
  - Definition of done: `wrangler.jsonc` declares one Durable Object class
    (`GameRoom`) bound as `ROOM`, registered under `new_sqlite_classes` in
    the `migrations` array. `worker.js` routes an incoming request to
    `env.ROOM.getByName(roomCode)`. A WebSocket connects successfully using
    `ctx.acceptWebSocket(server)` (not `server.accept()`), confirmed by
    sending a test message from the browser console and seeing it echoed
    back. ✅ Done — implemented together with 3.2-3.4 below, since a bare
    "connects and echoes" skeleton isn't separable from the real join
    logic in any meaningful way. `wrangler dev` confirms the `ROOM
    (GameRoom)` Durable Object binding loads with no errors.

- [x] **3.2 — Room join protocol and player identity**
  - Depends on: 3.1
  - Files: `src/room.js`, `public/online.js` (new)
  - Definition of done: two browser tabs can each connect to the same room
    code with a display name; the Durable Object assigns the first joiner
    White and the second Black, remembering which is which per connection
    using `ws.serializeAttachment()`/`deserializeAttachment()`; a third
    join attempt receives a clear "room full" message instead of being
    seated. ✅ Done in `src/room.js`. (`public/online.js`, the client side,
    is built as part of 3.5.)

- [x] **3.3 — Server-side move validation and broadcast**
  - Depends on: 3.2, 1.1
  - Files: `src/room.js` (importing `public/rules.js` directly, so the
    server and browser share the exact same rules module)
  - Definition of done: every `{ "type": "move", "payload": {...} }`
    message is checked against `rules.js` before being applied; legal
    moves update the Durable Object's board and are broadcast to both
    connected players as `{ "type": "state", "payload": {...} }`; illegal
    moves get an error message sent back to the sender only, with no change
    to the game state. ✅ Done.

- [x] **3.4 — Persistence and rejoin after refresh**
  - Depends on: 3.3
  - Files: `src/room.js`
  - Definition of done: the current board and whose turn it is are saved to
    the Durable Object's SQLite storage after every move; refreshing the
    page and reconnecting with the same room code and display name restores
    the game exactly where it left off. No timers, intervals, or Alarms are
    used anywhere in this file. ✅ Done. Reconnecting with the same display
    name reclaims the same color and the persisted board, rather than
    being treated as a brand-new player. Verified 3.1-3.4 together with
    11 automated WebSocket protocol checks against a real `wrangler dev`
    server (native Node `WebSocket`, no `ws`/Socket.IO/Express package
    used, matching the technical constraints): first/second joiner get
    White/Black, a third joiner is rejected, a legal move is validated
    and broadcast to both sides, moving out of turn is rejected, an
    illegal move is rejected with the same `rules.js` error, and
    disconnecting then reconnecting under the same name reclaims White
    and the exact in-progress position — zero server-side errors in the
    dev log during the run. `src/room.js` contains no `setInterval`,
    `setTimeout`, or Alarms, as required.

- [x] **3.5 — Wire up the Online UI**
  - Depends on: 3.4, 1.4
  - Files: `public/online.js`, `public/app.js`, `public/index.html`
  - Definition of done: from the landing screen, a player can create a room
    (and receive a shareable room code) or join one by entering a code and
    a display name; a move made on one screen appears on the other player's
    screen without a page refresh; check/checkmate/stalemate are shown the
    same way as in Hot-Seat. ✅ Done. `game-controller.js` gained two small
    extensions to support this: `onAttemptMove` (so a click sends a move
    to the server instead of applying it locally — Online never trusts
    its own browser) and `syncState`/`setHumanColor` (so it can adopt
    whatever the server broadcasts). A new "Online" setup screen lets a
    player enter a display name and either create a room (a random
    6-character code is generated, avoiding easily-confused characters
    like `0`/`O`) or join one by typing a code. The "New Game" button is
    hidden in Online mode, since restarting isn't part of this project's
    scope for a server-authoritative game — a room is for one game.
    Verified with 14 automated checks across real, separate browser
    pages acting as two independent players: room creation and joining,
    a third joiner cleanly rejected when the room is full, a move made
    by one player appearing on the other's screen live, and — the
    trickiest case — one player reloading the page mid-game and
    rejoining under the same name, correctly restoring both their seat
    and the exact in-progress position. Zero unexpected errors (the one
    console error observed was Carol's deliberate, expected room-full
    rejection).

- [x] **3.6 — Enable Online mode live and final redeploy**
  - Depends on: 3.5
  - Files: `public/app.js`
  - Definition of done: the "coming soon" flag is removed from Online mode;
    the commit is pushed to `main` and auto-deploys via the Cloudflare Git
    integration; two separate devices/browsers are confirmed able to play
    a full game together live on the internet using a room code. ✅ Done.
    Confirmed working live by the site owner.

---

## Phase 4 — Theming and polish (interleaved as time allows, not blocking)

- [x] **4.1 — Full D&D-class artwork/icon set for all pieces**
  - Depends on: 1.2
  - Files: `public/styles.css`, `public/piece-art.js` (new), `public/board.js`,
    `public/game-controller.js`, `ProductSpec.md`
  - Definition of done: every piece type on both sides has a distinct,
    finished D&D-class visual, replacing any placeholder used in 1.2. ✅
    Done, per the project owner's direction (medieval feel, strong
    contrast, each piece a different D&D class — e.g. Bishop as Wizard,
    Rook as Paladin). Each piece is a small hand-drawn SVG silhouette in
    `public/piece-art.js`: King (crowned band + cross), Queen/Sorceress
    (a many-pointed starburst crown), Rook/Paladin (a tower with a holy
    cross emblem), Bishop/Wizard (a pointed brimmed hat with a starlit
    tip), Knight/Ranger (a horse's head), Pawn/Militia (a plain-helmeted
    soldier). Every piece uses a dark-outline-on-light-fill (white) or
    light-outline-on-dark-fill (black) treatment so both sides stay
    legible on either board square color. `board.js` now renders these
    SVGs instead of the Unicode glyphs used since task 1.2, and the
    promotion picker's labels were updated to match (Paladin, Wizard).
    Iterated visually before integrating: an early knight design didn't
    read as a horse at all and was redrawn from scratch by actually
    looking at rendered screenshots, not just trusting the path
    coordinates. Verified with 7 automated checks across every mode
    (Hot-Seat, VS Computer, Online) confirming the new artwork renders
    and behaves correctly, plus a full-board screenshot check for visual
    quality and contrast — zero console errors.

- [ ] **4.2 — Match Figma screens exactly**
  - Depends on: Figma designs being shared (not yet available — see
    `ProductSpec.md` §1)
  - Files: TBD once Figma is available
  - Definition of done: each screen visually matches its corresponding
    Figma design, or any discrepancy is explicitly flagged back rather than
    silently changed.

- [x] **4.3 — Mobile/responsive layout pass**
  - Depends on: 1.5
  - Files: `public/styles.css`
  - Definition of done: all three modes are usable on a phone-sized screen
    (board fits without horizontal scrolling, buttons are tappable). ✅
    Done. Verified with 8 automated checks at both an iPhone SE-sized
    viewport (375×667, one of the smallest common phone screens) and
    Playwright's real "iPhone 13" device profile: no horizontal overflow
    on the menu, board, or Online setup screens; the board and its
    squares stay large enough to comfortably tap; tapping actually moves
    a piece. One real bug found and fixed by actually looking at the
    screenshot rather than trusting the pass/fail numbers alone: the
    "Back to Menu" button on the Online setup screen had no matching CSS
    selector and rendered as an unstyled default browser button, visibly
    broken next to the rest of the themed UI — fixed by giving it a
    shared `.btn-secondary` class.

---

## Status: complete

🎉 **Every task that could be done without further input is done, and
confirmed live** at https://dnd-chess.yankunzhang.workers.dev/ by the
project owner, including the D&D-class artwork. Hot-Seat, VS Computer,
and Online all work end-to-end, built without any third-party chess or
engine library, on the Cloudflare Workers Free plan, deploying
automatically on every push to `main`.

**Only 4.2 (matching Figma exactly) remains, and it stays paused
indefinitely** until actual Figma screens are shared for this project —
none have been so far. If that ever happens, this file is the place to
pick the work back up: read the relevant task above, check the
dependencies are still satisfied, and go from there.
