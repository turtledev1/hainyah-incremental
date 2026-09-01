# Hainyah Incremental

An incremental game of two gods, scarce land and slow conquest, in the spirit of
CivClicker. Hai holds the sun, Yah holds the ledger, and between them they rule
everything you can see. You start with ten empty acres and your own two hands, and
you finish — if you finish — by building the Temple of Hai and Yah.

## Playing

Pick a people, pick your magic circle, and click to gather. Every building takes one
acre, and the only way to get more acres is to take them from somebody else, so the
whole game is paced by conquest.

A run takes a couple of days of real time. Progress is saved to your browser and
keeps running while you are away, up to twelve hours per absence.

## Running it

```shell
npm install
npm run dev          # play it locally
npm test             # run the simulation tests
npm run typecheck    # strict TypeScript, no emit
npm run build        # production bundle in dist/
npm run simulate     # play the game headlessly and report how long a run takes
```

`npm run simulate` accepts a race and a day limit — `npm run simulate -- dwarf 5` —
and prints a day-by-day economy plus the time each ascension stage took. Because the
engine is pure and its random generator is seeded, it gives the same answer every
time, which is how the balance numbers get chosen.

## Deploying

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to
`main`. Enable Pages for the repository with "GitHub Actions" as the source. The Vite
`base` is `/hainyah-incremental/`.

## How the code is arranged

The rule that keeps this extensible: **content is data, systems are pure functions,
the store is a thin shell.**

```
src/
├── theme/           MUI theme (Hai's gold, Yah's violet)
├── game/
│   ├── model/       types only: ids, GameState, content interfaces, Modifier
│   ├── content/     the data registries — the extension points
│   ├── systems/     pure functions: (state, delta) => state, or a derived number
│   ├── engine/      seeded RNG, the tick, the browser loop, offline catch-up
│   ├── selectors/   one derived read model for the whole interface
│   ├── persistence/ save shape, migrations, storage, autosave
│   └── store/       Zustand store and player actions
└── ui/              screens, panels, components
```

### Adding things

Everything below is a data change. No system needs editing.

- **A race** — one entry in `content/races.ts`: some prose, a magic-circle allowance,
  and a list of modifiers.
- **A building** — one entry in `content/buildings.ts`, including what its workers
  produce or what capacity it grants.
- **A magic circle** — one entry in `content/magicCircles.ts` plus its spells in
  `content/spells.ts`.
- **A spell** — one entry in `content/spells.ts`. It is either a timed buff, a
  one-shot boost spent by the next attack or heist, or an instant effect with an
  `apply` function.
- **An upgrade** — one entry in `content/upgrades.ts`, with its costs, its
  prerequisites, and the modifiers it contributes.
- **A conquest or thievery target, or an ascension stage** — one entry in the
  matching file.

`content/index.ts` checks the whole registry on start-up: duplicate ids, dangling
prerequisites, spells in circles that do not exist, free upgrades, mis-ordered
ascension stages. A content mistake fails loudly instead of quietly disabling itself.

### The modifier pipeline

Races, buildings, upgrades, spells and the wonder all contribute the same shape:

```ts
interface Modifier {
  target: ModifierTarget       // 'production.food', 'capacity.army', 'warfare.attackPower', …
  operation: 'add' | 'multiply'
  value: number
}
```

Additive contributions land on the base value first, then every multiplier is
applied. That ordering is what lets a rule be *removed* rather than merely reduced:
the Undead not eating is `consumption.food × 0`, and their armies never dying is
`warfare.casualtyRate × 0`. There is no flag anywhere, and no system contains the
word "undead". The interface derives its wording from the resolved values too, so a
future race that merely halves food consumption needs no UI change.

### Text, plurals and translation

`src/i18n` holds interface copy and the chronicle's messages, with i18next
supplying CLDR plural rules — nothing in the game formats a plural by hand, so
"1 thief leaves the guild" and "3 thieves leave the guild" both conjugate correctly.

The chronicle stores **what happened, not a sentence about it**: each event is a
translation key plus its values, rendered at display time. A player who switches
language sees their whole history in the new one. Durations and large numbers go
through i18next formatters (`{{arrivalSeconds, duration}}`, `{{amount, compactNumber}}`)
so a system never bakes a formatted string into a save.

Adding a language is one file in `src/i18n/locales` plus one entry in
`src/i18n/index.ts`. A test walks the game's source for every `chronicle.*` key it
records and fails if the active locale is missing one, so a typo'd key cannot ship
as raw text on screen.

Content prose — race descriptions, spell descriptions, building flavour — stays in
`game/content`, because it is game data a designer edits rather than chrome a
translator edits. Those strings are passed into messages as values.

### Determinism

`engine/rng.ts` is a seeded generator whose cursor lives in the save. Every random
outcome — a heist going wrong, casualties in a battle — draws from it, so offline
catch-up reproduces exactly what continuous play would have produced, and every test
is repeatable without stubbing `Math.random`.

### Time away

`engine/offlineCatchUp.ts` runs the same `advanceGame` as the browser loop: second by
second for the first five minutes, then in one-minute buckets, capped at twelve hours
(`BALANCE.offline`). A frame gap longer than two seconds — a throttled or sleeping tab
— is handed to the same code rather than being lost.

### Balance

Every tunable number is in `content/balance.ts`, plus the costs and rates in the
content files. Nothing is hidden in a system.
