# API Gateway: Packet Sorter

Touch-first kiosk game for an iPad booth. Vite + React + TypeScript + Tailwind v4, no backend, works fully offline (localStorage + a small service worker in production builds).

```bash
npm install
npm run dev        # http://<your-ip>:5173 (host enabled, open it from the iPad on the same Wi-Fi)
npm run build && npm run preview   # production build (enables offline service worker)
```

On the iPad: Safari → Share → **Add to Home Screen** to run full-screen.

## Booth admin
Players enter their details before the game starts; the score is saved automatically when it ends.

Triple-tap the company logo (top-left in-game, or on the attract screen):
export scores as CSV, reset data, edit company name and the booth pitch (`[Company Name]` is replaced).

## Controls
Drag the active packet onto a zone, flick it (up/right = Production, down/left = Quarantine), or tap a zone. Desktop testing: arrow keys.

## Layout
- `src/game/` – rules, packet generator (45% valid), engine (phases, scoring, timeouts)
- `src/audio/sfx.ts` – Web Audio synthesized sounds
- `src/components/` – HUD, rules board, conveyor (pointer-event drag/flick), zones, screens
- `src/lib/storage.ts` – leaderboard, settings, CSV export

Design tokens follow the STACKIT look (navy `#000e19`/`#0a1e2d`, blue `#0046a0`, teal `#00c3cd`, orange `#f07d00`). Their typeface DIN 2014 is commercial, so Barlow is bundled as the free stand-in; if DIN 2014 is installed it is picked up first (see `--font-sans`).
