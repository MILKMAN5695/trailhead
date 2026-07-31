# Trailhead — Gear Closet & Trip Planner

A fully offline gear closet + trip planner. No Claude, no AI, no external
servers of any kind — storage and gear lookup both run in plain JavaScript,
right in your browser.

## Run it in VS Code

1. Open this folder in VS Code (`File → Open Folder…`).
2. Open the built-in terminal (`` Ctrl+` `` or `Terminal → New Terminal`).
3. Install dependencies:
   ```
   npm install
   ```
4. Start it:
   ```
   npm run dev
   ```
5. Open the URL it prints (usually `http://localhost:5173`) in your browser.

That's it — the app is running locally on your machine.

## What's fully offline here

- **Storage**: `src/storage.js` saves everything to your browser's
  `localStorage`. No account, no server, no sync between devices — it's
  tied to that one browser on that one machine. Clearing your browser's
  site data will erase it, so back up anything important.
- **Gear search**: `src/App.jsx` includes a small built-in `GEAR_DATABASE`
  array (~20 common backpacking items) that the search box filters with
  plain JavaScript (`Array.filter`) — no network request, no AI call,
  nothing leaves your machine. The specs/prices in it are approximate
  reference figures, not live data, since there's no internet lookup
  happening. You can freely edit that array in `App.jsx` to add your own
  frequently-used gear so it autofills next time.
- **Everything else** (trips, weather-based recommendations, essentials
  checklist, the profile/passphrase screen) works exactly as before —
  none of it ever depended on Claude to begin with.

## Building for real deployment

If you want a shareable link instead of just running it locally:
```
npm run build
```
This produces a `dist/` folder of static files you can upload to any static
host (Netlify, Vercel, GitHub Pages, Cloudflare Pages, or even just your own
server). Because storage is per-browser localStorage, each visitor gets
their own separate local copy — the "profile" screen just becomes a way to
have multiple named lists on the same browser, not a real shared account
system.

## Project structure

```
trailhead/
├── index.html          # Vite entry HTML
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx         # mounts the app, loads storage.js first
│   ├── storage.js       # localStorage-backed storage (no network)
│   └── App.jsx           # the whole app: gear closet, trips, search, etc.
└── README.md
```

## Making further changes

Everything lives in `src/App.jsx` — categories, spec fields per gear
subtype, the safety-essentials checklist, colors/theme, all of it. Paste
sections of it into a fresh Claude conversation any time you want help
extending it further, or edit it directly if you're comfortable with React.
