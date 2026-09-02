/** Every tunable number, so a balance pass is one file. `npm run simulate` checks it. */
export const BALANCE = {
  startingAcres: 10,

  /** Manual clicking: meaningful for the first minutes, irrelevant once buildings run. */
  manualGatherCooldownSeconds: 0.25,

  population: {
    arrivalsPerSecond: 0.035,
    /** More people means more parents, so a bigger realm fills a new house faster. */
    extraArrivalsPerCitizenPerSecond: 0.004,
    foodEatenPerCitizenPerSecond: 0.05,
    /** Growth pauses unless the granary holds this many seconds of food. */
    foodReserveSecondsRequiredForGrowth: 20,
    starvationDeathsPerSecondPerMissingFood: 0.4,
  },

  magic: {
    /**
     * Mana is meant to be scarce: a cast is a decision about which buff you want up,
     * not something to click through every couple of minutes. Buffs therefore last
     * most of a cooldown, and the pool refills slowly.
     */
    baseManaCapacity: 0,
    baseManaRegenPerSecond: 0,
    /**
     * A mage's pool and their recovery come from what they have learned, not from buildings.
     * The pool holds roughly two sustained buffs of the deepest tier reached, so which two
     * is a decision; recovery refills it over about two hours.
     */
    manaCapacityPerCircleTier: 12,
    manaRegenPerCircleTierPerSecond: 0.0017,
    manaCostByTier: [5, 10, 15, 20, 25, 30],
    /**
     * The decision a session turns on: the same mana buys one burst now, or two
     * sustained buffs that are still running while you are away.
     */
    burstManaCostMultiplier: 2,
    sustainedDurationSeconds: 90 * 60,
    sustainedCooldownSeconds: 120 * 60,
    burstDurationSeconds: 10 * 60,
    burstCooldownSeconds: 180 * 60,
    /** One-shot effects and the boosts that wait on a raid. */
    instantCooldownSeconds: 60 * 60,
    /** Transmute is a utility for a shortage, so it comes round sooner. */
    transmuteCooldownSeconds: 30 * 60,
    tierExperienceThresholds: [100, 600, 2_500, 10_000, 50_000, 250_000],
  },

  warfare: {
    /** Raw combat strength of one soldier before modifiers. */
    powerPerSoldier: 1,
    /** Random swing applied to attack power on resolution, +/- this fraction. */
    attackPowerVariance: 0.15,
    /** Fraction of the sent force lost in a won battle, scaled by relative strength. */
    baseCasualtyRateOnVictory: 0.08,
    baseCasualtyRateOnDefeat: 0.25,
  },

  thievery: {
    /** Loot swings between this fraction of the table and its full value. */
    minimumLootFraction: 0.6,
    /** No crew is ever certain, however deep the guild's pockets. */
    maximumSuccessChance: 0.95,
    minimumSuccessChance: 0.02,
  },

  upgrades: {
    /** An improvement stays hidden until this share of its cost is already in hand. */
    revealAtCostFraction: 0.5,
  },

  workforce: {
    /** Troops over capacity drift away at this rate instead of vanishing at once. */
    desertionFractionPerSecond: 0.05,
  },

  construction: {
    /** A short queue keeps early building decisions meaningful. */
    baseQueueLength: 5,
    /**
     * Placing one order at a time is a decision on ten acres and an errand on ten
     * thousand, so larger steps open up as the realm grows.
     */
    bulkSteps: [
      { size: 10, unlockedAtAcres: 100 },
      { size: 100, unlockedAtAcres: 1_000 },
    ],
  },

  offline: {
    maximumCreditedSeconds: 12 * 60 * 60,
    /** Elapsed time below this is simulated second by second, above it in coarse buckets. */
    fineGrainedSeconds: 5 * 60,
    coarseBucketSeconds: 60,
  },

  eventLog: {
    maximumEntries: 120,
  },

  autosaveIntervalSeconds: 5,
} as const

export const FIXED_TICK_SECONDS = 0.1
