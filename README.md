# Hainyah Incremental

**[Play it here](https://turtledev1.github.io/hainyah-incremental/)**

An idle/incremental game in the spirit of CivClicker. Hai and Yah are the two gods
ruling the world. You start with ten acres and no buildings, and win by finishing the
Wonder of Hai and Yah.

Every building takes one acre, and the only way to get more acres is to conquer them,
so conquest paces everything else. You can only keep one army in the field at a time
until the Command upgrades raise that to three, which makes marching on somewhere
larger worth more than raiding hamlets forever. A full run is about five days.

## Features

### Offline progress

The game saves to your browser and keeps simulating while you're away, up to 12 hours
at a time. Same tick as the live game, so nothing is estimated — you just come back to
a bigger pile of resources and a chronicle of what happened.

### Translations

The game currently supports English and French, which you can pick in the settings.
Every word lives in `src/i18n/locales`, so adding a language is a translation rather
than a code change — pull requests welcome.

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

Merging to `main` automatically publishes to GitHub Pages.

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

Races, buildings, upgrades and spells all contribute the same shape:

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

Balance lives in `content/balance.ts` plus the costs and rates in the content files.
