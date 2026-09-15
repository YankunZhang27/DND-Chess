# Product Spec — D&D Chess

## 1. What it does

A single web page where a visitor picks one of three ways to play chess:

| Mode | Who plays White and Black | How moves travel |
|---|---|---|
| **Hot-Seat** | Two people, same screen, alternating turns | Nowhere — it's all in one browser tab |
| **VS Computer** | One person + the browser's own logic | Nowhere — the computer's move is calculated on the visitor's own device |
| **Online** | Two people, two different devices, matched by a shared room code | Over the internet, via Cloudflare |

The chess rules are the same in every mode — standard chess, including
castling, en passant (a special pawn capture), and pawn promotion. There are
no accounts, passwords, ratings, or saved history beyond the current game. If
a player refreshes the page mid-game in Online mode, rejoining with the same
room code puts them back where they left off.

**Theming:** every piece is re-skinned as a D&D class (visual/name only — a
Bishop still moves like a Bishop). Example mapping, subject to whatever the
Figma designs specify once available:

| Chess piece | D&D theme |
|---|---|
| King | King/Paladin |
| Queen | Sorceress |
| Rook | Fighter (tower/stronghold) |
| Bishop | Cleric |
| Knight | Ranger |
| Pawn | Militia |

> **Note:** No Figma file has been shared in this project yet. Until one is,
> the visual design will use a placeholder dark-fantasy theme (parchment
> background, gold/crimson accents). Once Figma screens are provided, the
> relevant tasks in the workplan will be updated to match them exactly — or
> flagged if something shown isn't buildable under the technical constraints
> below.

## 2. How it's organized (architecture)

There are exactly two places code runs:

1. **The browser** (`public/` folder) — draws the board, accepts clicks,
   enforces rules instantly so illegal moves are never even offered, and (in
   VS Computer mode) calculates the computer's reply.
2. **Cloudflare's servers** (`src/` folder) — only involved for Online mode.
   A `worker.js` file hands each request to the right place; a `room.js`
   Durable Object (see the README's glossary) acts as the single referee for
   one game room, storing the board and validating every move before telling
   both players about it.

**Why the same rules file is used in both places:** `public/rules.js`
contains every rule of chess (see §4) and nothing else — no drawing, no
buttons. Because it's a plain, self-contained module, both the browser code
in `public/` and the server code in `src/room.js` import that *exact same
file*. This guarantees the browser and the server can never disagree about
what move is legal — there's only one rulebook, not two copies that could
drift apart.

### Data flow by mode

**Hot-Seat:** click → `hotseat.js` asks `rules.js` "what are the legal
moves from this square?" → highlights them → click a destination →
`rules.js` applies the move and reports whether it's check/checkmate/
stalemate → `board.js` redraws → turn passes to the other player. Nothing
leaves the browser tab.

**VS Computer:** identical to Hot-Seat for the human's turn. After the
human moves, `vscomputer.js` calls `ai.js`, which tries the computer's
possible replies two moves deep (see §5) and plays the best one it finds,
using `rules.js` to know what's legal at each step.

**Online:** `online.js` opens a WebSocket (see README glossary) to
`worker.js`, which forwards it to the Durable Object for that room code.
Every message sent over that connection is a small JSON object shaped like
`{ "type": "...", "payload": { ... } }` — for example, a move looks like
`{ "type": "move", "payload": { "from": "e2", "to": "e4" } }`. The Durable
Object checks the move against `rules.js` itself before accepting it (never
trusting the browser), updates its saved copy of the board, and sends a
`{ "type": "state", "payload": {...} }` message to *both* players so their
screens update together. Because the Durable Object saves the board after
every move, refreshing the page and reconnecting restores the game exactly
as it was.

## 3. Landing screen / mode switching

One HTML page (`public/index.html`) with a start screen offering the three
modes as buttons. `app.js` swaps between mode-specific screens without ever
reloading the page (a "single-page application" — the browser only ever
downloads that one HTML page; everything else happens by JavaScript changing
what's on screen). This is also why the Cloudflare configuration sets
`not_found_handling` to `"single-page-application"`: if someone opens a
direct link mid-app, Cloudflare should still serve `index.html` rather than
a generic error page.

## 4. The rules engine (`public/rules.js`)

A single hand-written module (no third-party chess library) responsible for:

- The starting position and board representation.
- Legal-move generation for all six piece types.
- Turn order (White then Black, alternating).
- Detecting check, checkmate, and stalemate.
- Castling (king and rook's special first-move swap).
- En passant (a pawn's special capture of another pawn that just moved two
  squares past it).
- Pawn promotion (a pawn reaching the far side becomes another piece, chosen
  by the player).

Its job is to make an illegal move *impossible*, not just discouraged — the
UI only ever offers squares that `rules.js` itself confirms are legal, and
(for Online mode) the server double-checks the same way before trusting any
move a player's browser sends.

**Explicitly out of scope**, per the project's rules: draw by repetition,
the fifty-move rule, and chess clocks/timers. A game ends only by
checkmate, stalemate, or a player choosing "New Game."

## 5. The computer opponent (`public/ai.js`)

Runs entirely in the visitor's browser — no server, no external chess
engine or API. It uses two well-known techniques:

- **Minimax:** the computer imagines a few moves ahead — "if I play this,
  what's my opponent's best reply, and what's my best reply to that?" — and
  picks the move that leaves it best off assuming the opponent also plays
  well. "Depth 2" here means it looks two half-moves ahead (its own move,
  then the opponent's best answer).
- **Alpha-beta pruning:** a shortcut that lets minimax skip exploring
  branches it can prove won't change the outcome, so it reaches the same
  decision faster.
- **Scoring:** each piece is worth a standard point value (pawn 1, knight/
  bishop 3, rook 5, queen 9); the computer prefers positions where it's
  ahead on total value.

This must return a move within two seconds on ordinary hardware — a
depth-2 search with standard piece scoring is intentionally modest in scope
to guarantee that.

## 6. Online mode protocol (`src/room.js` ↔ `public/online.js`)

- A room is identified purely by its room code (a short string), used as
  the Durable Object's name via `env.ROOM.getByName(roomCode)`.
- Joining a room requires only a display name — no password or account.
- The first two players to join a room are assigned White and Black; a
  third join attempt is told the room is full.
- The Durable Object is the single source of truth: it never trusts a
  "this move is legal" claim from a browser — it re-checks every move
  against `rules.js` itself.
- Player identity per connection is remembered using the WebSocket's
  attachment feature (`serializeAttachment`/`deserializeAttachment`), so the
  Durable Object always knows which open connection is White and which is
  Black.
- There are no timers anywhere in the Durable Object (no `setInterval`,
  `setTimeout`, or Alarms) because chess here has no clock — the only things
  that happen are "a player connected," "a player moved," and "a player
  disconnected."

## 7. Explicitly out of scope (by design)

- Accounts, logins, passwords, or any user database.
- Chess clocks, ratings, matchmaking beyond a shared room code.
- Draw by repetition or the fifty-move rule.
- An opening book (pre-programmed opening moves) for the computer.
- Exporting/saving game history or move lists.
- Any third-party chess rules or chess engine library (chess.js, Stockfish,
  or similar) — the rules and the computer opponent are both written from
  scratch in this project.
- A traditional always-on server (no Express, Socket.IO, or `ws` package) —
  Cloudflare Workers cannot run that kind of long-lived Node.js server
  process, so everything server-side is written for the
  request/response-and-WebSocket model Workers actually support.
