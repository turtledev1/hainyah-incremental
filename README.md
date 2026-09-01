# Hainyah Incremental

**[Play it here](https://turtledev1.github.io/hainyah-incremental/)**

An idle/incremental game in the spirit of CivClicker. Hai and Yah are the two gods
ruling the world. You start with ten acres and no buildings, and win by finishing the
Wonder of Hai and Yah.

Every building takes one acre, and the only way to get more acres is to conquer them,
so conquest paces everything else. A full run is a couple of days. The game saves to
your browser and keeps simulating while you're away, up to 12 hours at a time.

## Development

```shell
npm install
npm run dev          # dev server
npm test             # vitest
npm run typecheck    # tsc, no emit
npm run build        # bundle to dist/
npm run simulate     # headless run, reports time to win
```

`npm run simulate -- dwarf 5` plays 5 days as dwarves and prints a day-by-day economy
plus the time each Wonder stage took. The engine is pure and the RNG is seeded, so it
gives the same answer every time. That's how the balance numbers were picked.

Set `SIMULATE_EXPORT_AT_HOURS=48` to also print an importable save from that point,
which is handy for testing the late game without playing to it.

## Deploying

`.github/workflows/deploy.yml` publishes to GitHub Pages on push to `main`. Pages
needs "GitHub Actions" as its source. Vite's `base` is `/hainyah-incremental/`, so it
has to match the repo name.

## Layout

```
src/
├── theme/           MUI theme
├── i18n/            interface copy and the chronicle's messages
├── game/
│   ├── model/       types: ids, GameState, content interfaces, Modifier
│   ├── content/     the data registries
│   ├── systems/     pure functions over state
│   ├── engine/      seeded RNG, tick, browser loop, offline catch-up
│   ├── selectors/   one derived read model for the UI
│   ├── persistence/ save shape, migrations, storage, autosave
│   └── store/       Zustand store and player actions
└── ui/              screens, panels, components
```

Content is data, systems are pure functions, the store is thin. Adding a race,
building, spell, upgrade or conquest target means adding an entry to the matching file
in `content/` — no system code. `content/index.ts` validates the whole registry at
start-up (duplicate ids, dangling prerequisites, spells in circles that don't exist)
and throws rather than silently disabling something.

## Notes

**Modifiers.** Races, buildings, upgrades and spells all contribute the same shape:

```ts
interface Modifier {
  target: ModifierTarget       // 'production.food', 'warfare.attackPower', …
  operation: 'add' | 'multiply'
  value: number
}
```

Adds apply before multiplies, which is what lets a modifier remove a rule instead of
just reducing it: the Undead not eating is `consumption.food × 0`. No system knows
what an Undead is.

**Balance** lives in `content/balance.ts` plus the costs and rates in the content
files.

**Offline progress** runs the same tick as the browser loop, second by second for the
first five minutes and then in one-minute buckets. A frame gap over two seconds (a
throttled or sleeping tab) goes through the same path.

**i18n.** Chronicle events are stored as a translation key plus values, not as
sentences, so switching language re-renders past events too. Adding a locale is one
file in `src/i18n/locales` and one entry in `src/i18n/index.ts`. Tests fail if a key
the UI asks for is missing. Content prose (race, spell and building descriptions)
stays in `content/` since it's game data, not UI chrome.
