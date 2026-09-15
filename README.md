# D&D Chess

A browser-based chess game with a Dungeons & Dragons visual theme (pieces are
skinned as D&D classes — e.g. the Bishop as a Cleric, the Knight as a Ranger —
but the rules underneath are ordinary chess). It has three ways to play:

1. **Hot-Seat** — two people share one screen/keyboard and take turns.
2. **VS Computer** — the browser itself plays the opposing side.
3. **Online** — two players on two different devices join the same game
   using a short room code and see each other's moves live.

## Who built this

Built by Yankun Zhang (yankunzhang@brandeis.edu) with Claude Code acting as
the developer, in incremental, reviewed steps tracked in
[`FEATUREROADMAP_workplan.md`](./FEATUREROADMAP_workplan.md).

## A few terms used below

- **Cloudflare Workers** — the hosting platform this app runs on. Instead of
  renting and managing a traditional server that's always on, your code runs
  in small, fast slices on Cloudflare's network only when a request comes in.
  There's a free usage tier ("Workers Free plan"), which this project is
  built to stay within.
- **Wrangler** — the command-line tool Cloudflare provides for developing and
  deploying a Workers project. Running `wrangler dev` starts a local copy on
  your machine; `wrangler deploy` publishes it to the internet.
- **Durable Object** — a small, persistent piece of server-side code paired
  with its own private storage, addressed by a name you choose (here, the
  room code). Cloudflare guarantees only one instance of a given Durable
  Object runs at a time, which makes it a natural "referee" for a single game
  room: there's no risk of two conflicting copies of the game state existing
  at once.
- **WebSocket** — a live, two-way connection between a browser and a server
  that stays open, so either side can send a message at any moment (unlike a
  normal web page request, which is a one-time question-and-answer). This is
  how the Online mode delivers a player's move to their opponent instantly.

## Running it locally

Requires [Node.js](https://nodejs.org) installed on your machine.

```bash
npm install
npm run dev
```

This starts a local copy at `http://localhost:8787` using Wrangler's dev
server, which behaves like the real Cloudflare environment (including the
Durable Object used for Online mode) without needing a Cloudflare account.

## Deploying it live

Requires a free [Cloudflare account](https://dash.cloudflare.com/sign-up).

```bash
npx wrangler login   # opens a browser to connect your Cloudflare account
npm run deploy
```

Wrangler will print a live URL when it finishes, e.g.
`https://dnd-chess.<your-subdomain>.workers.dev`. Anyone with that link can
play — no installation needed on their end.

## Project layout

```
public/            Everything served to the browser (the actual game)
  index.html       The single page the app runs on
  rules.js         The chess rules engine — shared by the browser AND the
                    server-side referee for Online mode, so both always
                    agree on what's legal
  board.js         Draws the board and handles clicking/selecting squares
  ai.js            The computer opponent (VS Computer mode)
  hotseat.js       Hot-Seat mode logic
  vscomputer.js    VS Computer mode logic
  online.js        Online mode logic (talks to the server over WebSocket)
  app.js           Landing screen / mode switcher
  styles.css       D&D-themed visual styling

src/               Code that runs on Cloudflare's servers, not the browser
  worker.js        Entry point: serves the files in public/, and routes
                    Online-mode connections to the right game room
  room.js          The Durable Object: one instance per game room, the sole
                    authority on that room's game state

wrangler.jsonc     Cloudflare Workers configuration
FEATUREROADMAP_workplan.md   The build plan, as checkboxes, in build order
ProductSpec.md     What the app does and how it's organized, in more detail
```

## Status

See [`FEATUREROADMAP_workplan.md`](./FEATUREROADMAP_workplan.md) for exactly
what's built so far and what's next. Hot-Seat mode is built and deployed
first, then VS Computer, then Online — each phase ships as a live,
playable update before the next one starts.
