export const EN_CONTENT = {
  resources: {
    food: {
      name: 'food',
      flavor: 'Grain, roots and salted meat. Your people eat whether or not you conquer.',
      gatherAction: 'Forage',
    },
    wood: {
      name: 'wood',
      flavor: 'Timber for houses, scaffolds and siege ladders.',
      gatherAction: 'Gather wood',
    },
    stone: {
      name: 'stone',
      flavor: 'Cut blocks. Everything that must outlast you is built from it.',
      gatherAction: 'Collect stone',
    },
    gold: {
      name: 'gold',
      flavor: 'Struck coin. It buys tools, silence and soldiers.',
    },
  },
  races: {
    human: {
      name: 'Humans',
      tagline: 'Numerous, adaptable, unremarkable — and therefore hard to stop.',
      advantages: [
        'Citizens arrive 30% faster than for any other race',
        'Buildings cost 10% less and rise 25% faster',
        'Free choice of any single elemental circle',
      ],
      disadvantages: [
        'No exceptional talent in any single field',
        'No access to the Dark Circle',
      ],
    },
    dwarf: {
      name: 'Dwarves',
      tagline: 'Stone is a language, and they are fluent.',
      advantages: [
        'Mines yield 60% more gold',
        'Quarries yield 25% more stone',
        'Sturdy soldiers: 20% fewer battle casualties',
      ],
      disadvantages: [
        'Farms yield 15% less food',
        'Armies march slowly: 25% longer to reach a target',
        'Only the Fire or Earth Circle will have them',
      ],
    },
    undead: {
      name: 'The Undead',
      tagline: 'They do not hunger, and they do not stay dead.',
      advantages: [
        'Your people never eat — farms are pointless, famine impossible',
        'Nothing already dead can die again: no losses in battle or on a heist, though either can still fail',
        'Command of the Dark Circle',
      ],
      disadvantages: [
        'The grave is slow to give up new bodies: 40% slower population growth',
        'Temples yield 20% less magical experience',
        'Thieves are clumsy: 20% lower success chance',
      ],
    },
    elf: {
      name: 'Elves',
      tagline: 'They learned both songs: the one that grows and the one that unmakes.',
      advantages: [
        'The Dark Circle by right, plus one elemental circle of your choosing',
        'Two circles carry far more mana than one, in pool and in recovery',
        'Temples yield 50% more magical experience',
        'Lumber camps yield 30% more wood',
      ],
      disadvantages: [
        'Few and slow to multiply: 25% slower population growth',
        'Study split two ways: each circle is slower to reach its deepest spells',
        'Mines yield 20% less gold',
        'Fragile in battle: 25% more casualties',
      ],
    },
    gargoyle: {
      name: 'Gargoyles',
      tagline: 'Stone that flies. It arrives first, and it does not arrive whole.',
      advantages: [
        'Armies reach a target and return in half the time',
        'Heists are over in half the time',
        'The Circle of Air by right, which makes the swift swifter still',
      ],
      disadvantages: [
        'Carved limbs shatter: twice the losses in battle',
        'Twice the losses on a heist as well',
        'Chiselled, not born: 20% slower population growth',
        'Claws of stone are poor at carpentry: buildings rise 20% slower',
      ],
    },
    orc: {
      name: 'Orcs',
      tagline: 'They live badly in peace and very well in war.',
      advantages: [
        'Every soldier strikes 50% harder',
        'A barracks packs twice as many of them in',
        'They sack a place thoroughly: 25% more plunder',
        'Bare hands that shift 50% more when you gather yourself',
      ],
      disadvantages: [
        'A house that holds five humans holds four orcs',
        'They eat meat, and a lot of it: 40% more food per head',
        'No patience for study: 25% less magical experience',
        'Only the Fire or Earth Circle will have them',
      ],
    },
    hobbit: {
      name: 'Hobbits',
      tagline: 'Six meals a day, and someone else always pays for them.',
      advantages: [
        'Unmatched thieves: 60% better odds on any job',
        'They know what is worth taking: 40% more loot',
        'They slip away: 60% fewer losses on a heist',
        'The larder is never empty: farms yield 30% more food',
      ],
      disadvantages: [
        'Nothing worth doing is worth rushing: heists take a third longer',
        'Short legs: armies march 40% slower',
        'Thieves, not looters: 30% less plunder from a battle',
        'No love for deep dark places: mines yield 25% less gold',
      ],
    },
  },
  buildings: {
    house: {
      name: 'House',
      flavor: 'Four walls and a hearth. Raises the number of citizens your land can hold.',
    },
    farm: {
      name: 'Farm',
      flavor: 'Furrowed fields. Assign citizens to work them.',
      workerRole: 'farmers',
      workerRoleSingular: 'farmer',
    },
    lumberCamp: {
      name: 'Lumber Camp',
      flavor: 'Axes, sledges and a felling yard.',
      workerRole: 'woodcutters',
      workerRoleSingular: 'woodcutter',
    },
    quarry: {
      name: 'Quarry',
      flavor: 'A worked face of rock and the dust that comes with it.',
      workerRole: 'quarriers',
      workerRoleSingular: 'quarrier',
    },
    mine: {
      name: 'Mine',
      flavor: 'A shaft driven after a vein of ore.',
      workerRole: 'miners',
      workerRoleSingular: 'miner',
    },
    barracks: {
      name: 'Barracks',
      flavor: 'Drill yard and bunks. Assigned citizens train and hold soldiers in readiness.',
      workerRole: 'drill-masters',
      workerRoleSingular: 'drill-master',
    },
    thievesGuild: {
      name: 'Thieves\' Guild',
      flavor: 'A quiet door in a loud street. Assigned citizens run the network.',
      workerRole: 'fences',
      workerRoleSingular: 'fence',
    },
    temple: {
      name: 'Temple',
      flavor: 'Twin altars to Hai and Yah. Assigned citizens study, and the circles answer.',
      workerRole: 'priests',
      workerRoleSingular: 'priest',
    },
  },
  magicCircles: {
    fire: {
      name: 'Circle of Fire',
      flavor: 'Hai’s half of the sky: the sun that ripens and the flame that ends.',
    },
    air: {
      name: 'Circle of Air',
      flavor: 'Everything moves faster when the wind is on your side.',
    },
    water: {
      name: 'Circle of Water',
      flavor: 'Rain, wells and tides. The circle that feeds a growing people.',
    },
    earth: {
      name: 'Circle of Earth',
      flavor: 'Stone answers slowly, but it answers, and it does not break.',
    },
    dark: {
      name: 'Dark Circle',
      flavor: 'Yah’s half: the ledger where one thing is traded for another.',
    },
  },
  spells: {
    'fire.sunlight': {
      name: 'Sunlight',
      description: 'Hai leans closer, and the farms yield 60% more.',
    },
    'fire.forgeFire': {
      name: 'Forge Fire',
      description: 'Smelters run white-hot, and the mines yield 70% more.',
    },
    'fire.immolate': {
      name: 'Immolate',
      description: 'Your soldiers go in burning. Attack power trebles while it lasts — send them now.',
    },
    'fire.wildfire': {
      name: 'Wildfire',
      description: 'Sets the next target’s fields alight before you arrive: its defence −40%.',
    },
    'fire.solarZenith': {
      name: 'Solar Zenith',
      description: 'A noon that will not end. Farms and mines both yield 120% more.',
    },
    'fire.phoenixPyre': {
      name: 'Phoenix Pyre',
      description: 'Half of those who fell in your last battle walk out of the ashes.',
    },
    'air.windmill': {
      name: 'Windmill',
      description: 'A steady wind on the sails, and the farms yield 60% more.',
    },
    'air.tailwind': {
      name: 'Tailwind',
      description: 'Armies and thieves move 80% faster.',
    },
    'air.haste': {
      name: 'Haste',
      description: 'Every hand moves quicker: all production +50%.',
    },
    'air.whisperingWinds': {
      name: 'Whispering Winds',
      description: 'The wind tells your thieves where the guards are: the next heist is twice as likely to succeed.',
    },
    'air.stormFront': {
      name: 'Storm Front',
      description: 'One army rides the storm: double march speed and −25% enemy defence.',
    },
    'air.timelessGale': {
      name: 'Timeless Gale',
      description: 'The wind holds its breath: all production doubled.',
    },
    'water.irrigation': {
      name: 'Irrigation',
      description: 'Channels run full, and the farms yield 70% more.',
    },
    'water.cleansingRain': {
      name: 'Cleansing Rain',
      description: 'Sickness washes out of the streets and the empty houses fill.',
    },
    'water.deepWell': {
      name: 'Deep Well',
      description: 'Food +45%, and the houses hold a quarter more.',
    },
    'water.tideOfPlenty': {
      name: 'Tide of Plenty',
      description: 'The granary floods with fish: stored food doubles, up to a limit.',
    },
    'water.mistVeil': {
      name: 'Mist Veil',
      description: 'Your next heist runs under fog: casualties −85%.',
    },
    'water.wellspring': {
      name: 'Wellspring',
      description: 'A spring that does not fail: farms doubled.',
    },
    'earth.stoneshaping': {
      name: 'Stoneshaping',
      description: 'The face splits where you ask it to: quarries +70%.',
    },
    'earth.veinsOfOre': {
      name: 'Veins of Ore',
      description: 'Gold shows itself in the rock: mines +70%.',
    },
    'earth.bulwark': {
      name: 'Bulwark',
      description: 'Stone closes over your ranks: they lose almost nobody. March while it holds.',
    },
    'earth.terraform': {
      name: 'Terraform',
      description: 'Raises one new acre out of the sea, paid for in stone and wood that rise with every acre you already hold.',
    },
    'earth.livingStone': {
      name: 'Living Stone',
      description: 'The walls raise themselves — six times the pace, for ten minutes.',
    },
    'earth.mountainsHeart': {
      name: 'Mountain\'s Heart',
      description: 'Quarries and mines both yield 120% more.',
    },
    'dark.blight': {
      name: 'Blight',
      description: 'Rot in their stores before the first spear is thrown: the next target’s defence −35%.',
    },
    'dark.transmute': {
      name: 'Transmute',
      description: 'Yah keeps a ledger: a tenth of your largest store is spent, and everything else rises by a share of it. A deeper circle loses less in the trade, and at the deepest it gains.',
    },
    'dark.sacrifice': {
      name: 'Sacrifice',
      description: 'A tenth of your people are given to Yah, and an hour of the work they would have done comes back at once — so the more your realm produces, the richer the offering.',
    },
    'dark.barrowLegion': {
      name: 'Barrow Legion',
      description: 'Yah opens the barrows, and for ten minutes your barracks hold twice as many soldiers. Recruit and march at once — when it fades, anyone above your true capacity deserts, though an army already in the field is spared until it comes home.',
    },
    'dark.soulHarvest': {
      name: 'Soul Harvest',
      description: 'Every enemy who falls pays for it: plunder is worth six times as much.',
    },
    'dark.pactOfHaiAndYah': {
      name: 'Pact of Hai and Yah',
      description: 'Both gods march with you, and the price is every other spell: production and attack double, and no mana returns while the pact holds.',
    },
  },
  upgradeLines: {
    housing: {
      name: 'Housing',
      flavor: 'Better walls hold more people in the same acre.',
    },
    farming: {
      name: 'Farming',
      flavor: 'Tools and technique between you and famine.',
    },
    woodcutting: {
      name: 'Woodcutting',
      flavor: 'Sharper steel, fewer strokes.',
    },
    quarrying: {
      name: 'Quarrying',
      flavor: 'Splitting rock is a craft, not a labour.',
    },
    mining: {
      name: 'Mining',
      flavor: 'Deeper shafts, richer seams.',
    },
    preservation: {
      name: 'Preservation',
      flavor: 'Food that keeps is food you did not lose.',
    },
    logistics: {
      name: 'Logistics',
      flavor: 'Roads make every other improvement worth more.',
    },
    masonry: {
      name: 'Masonry',
      flavor: 'Anyone can stack stone. Doing it quickly is a trade.',
    },
    military: {
      name: 'Military',
      flavor: 'Drill, discipline and engines of war.',
    },
    command: {
      name: 'Command',
      flavor: 'Officers who can be trusted with an army of their own.',
    },
    thievery: {
      name: 'Thievery',
      flavor: 'The quiet trade, practised properly.',
    },
    arcana: {
      name: 'Arcana',
      flavor: 'Instruments and libraries for the circles.',
    },
    gathering: {
      name: 'Gathering',
      flavor: 'Your own two hands, better used.',
    },
    fortification: {
      name: 'Fortification',
      flavor: 'Endless small reinforcements. Repeatable.',
    },
    bribery: {
      name: 'Bribery',
      flavor: 'Coin in the right palm, again and again. Repeatable.',
    },
  },
  upgrades: {
    'housing.timberFrames': {
      name: 'Timber Frames',
      flavor: 'A proper frame instead of lashed poles.',
    },
    'housing.stoneHouses': {
      name: 'Stone Houses',
      flavor: 'Cut stone, two storeys, a real roof.',
    },
    'housing.manorHalls': {
      name: 'Manor Halls',
      flavor: 'Long halls that sleep whole families.',
    },
    'farming.ironPlows': {
      name: 'Iron Plows',
      flavor: 'Iron cuts the sod the wooden share only bruised.',
    },
    'farming.cropRotation': {
      name: 'Crop Rotation',
      flavor: 'Rest a field and it pays you back.',
    },
    'farming.aqueducts': {
      name: 'Aqueducts',
      flavor: 'Water arrives whether or not it rains.',
    },
    'woodcutting.bronzeAxes': {
      name: 'Bronze Axes',
      flavor: 'Cast heads that keep an edge.',
    },
    'woodcutting.steelAxes': {
      name: 'Steel Axes',
      flavor: 'Half the strokes, twice the trees.',
    },
    'woodcutting.whipsaws': {
      name: 'Whipsaws',
      flavor: 'Two-man saws and a felling yard that never stops.',
    },
    'quarrying.ironChisels': {
      name: 'Iron Chisels',
      flavor: 'Stone splits where you mark it.',
    },
    'quarrying.wedgeAndFeather': {
      name: 'Wedge & Feather',
      flavor: 'A trick of iron that opens a face cleanly.',
    },
    'quarrying.cranes': {
      name: 'Treadwheel Cranes',
      flavor: 'Blocks leave the pit as fast as they are cut.',
    },
    'mining.ironPicks': {
      name: 'Iron Picks',
      flavor: 'Iron bites where bronze glances.',
    },
    'mining.steelPicks': {
      name: 'Steel Picks',
      flavor: 'Tempered heads and a smith to keep them.',
    },
    'mining.blastingPowder': {
      name: 'Blasting Powder',
      flavor: 'A charge does in a heartbeat what a shift could not.',
    },
    'preservation.rootCellars': {
      name: 'Root Cellars',
      flavor: 'Cold earth keeps a harvest honest.',
    },
    'preservation.granaries': {
      name: 'Granaries',
      flavor: 'Raised floors, tight lids, no vermin.',
    },
    'preservation.coldVaults': {
      name: 'Cold Vaults',
      flavor: 'Ice cut in winter, kept all year.',
    },
    'logistics.handcarts': {
      name: 'Handcarts',
      flavor: 'Nobody should carry what a wheel can.',
    },
    'logistics.wagons': {
      name: 'Wagons',
      flavor: 'Draught teams and axles.',
    },
    'logistics.pavedRoads': {
      name: 'Paved Roads',
      flavor: 'Stone under every wheel in the realm.',
    },
    'masonry.workCrews': {
      name: 'Work Crews',
      flavor: 'Gangs who know the order the work goes in.',
    },
    'masonry.scaffolding': {
      name: 'Scaffolding',
      flavor: 'Nobody waits for a ladder any more.',
    },
    'masonry.masterBuilders': {
      name: 'Master Builders',
      flavor: 'They have raised a hundred of these.',
    },
    'military.drillYards': {
      name: 'Drill Yards',
      flavor: 'Soldiers who have done it before.',
    },
    'military.standingArmy': {
      name: 'Standing Army',
      flavor: 'Paid, housed, always ready.',
    },
    'military.siegeEngines': {
      name: 'Siege Engines',
      flavor: 'Walls stop being an argument.',
    },
    'command.warCaptains': {
      name: 'War Captains',
      flavor: 'A second column, and someone fit to lead it.',
    },
    'command.warGenerals': {
      name: 'War Generals',
      flavor: 'Three campaigns at once, and none of them yours to babysit.',
    },
    'thievery.lockpicks': {
      name: 'Lockpicks',
      flavor: 'A set of picks and someone taught to use them.',
    },
    'thievery.smokeBombs': {
      name: 'Smoke Bombs',
      flavor: 'An exit is worth more than an entrance.',
    },
    'thievery.guildNetwork': {
      name: 'Guild Network',
      flavor: 'Eyes in every city you have not taken yet.',
    },
    'arcana.scriptoria': {
      name: 'Scriptoria',
      flavor: 'Someone finally wrote it down.',
    },
    'arcana.astrolabes': {
      name: 'Astrolabes',
      flavor: 'Hai and Yah measured against the stars.',
    },
    'arcana.leyLines': {
      name: 'Ley Lines',
      flavor: 'The circles no longer wait on your temples.',
    },
    'gathering.callousedHands': {
      name: 'Calloused Hands',
      flavor: 'You have done this a while now.',
    },
    'gathering.practisedHands': {
      name: 'Practised Hands',
      flavor: 'Fewer wasted motions.',
    },
    'gathering.masterGatherers': {
      name: 'Master Gatherers',
      flavor: 'A crew that follows where you point.',
    },
    'fortification.reinforceWalls': {
      name: 'Reinforce Walls',
      flavor: 'Another course of stone, another few soldiers home.',
    },
    'bribery.guildBribes': {
      name: 'Guild Bribes',
      flavor: 'Coin in the right palm, though no job is ever certain.',
    },
  },
  conquestTargets: {
    hamlet: {
      name: 'Outlying Hamlet',
      flavor: 'Eleven families and a fence. They will not hold.',
    },
    village: {
      name: 'Riverside Village',
      flavor: 'A mill, a shrine, and men who have fought off raiders before.',
    },
    town: {
      name: 'Walled Town',
      flavor: 'A ditch, a gate and a garrison that is paid on time.',
    },
    city: {
      name: 'Free City',
      flavor: 'Towers, a standing watch, and a council that will not treat with you.',
    },
    capital: {
      name: 'Rival Capital',
      flavor: 'A throne that has never been taken. Its army is professional.',
    },
    twinThrones: {
      name: 'The Twin Thrones',
      flavor: 'The seat where Hai and Yah are said to argue. Whoever holds it holds the world’s last free acres.',
    },
  },
  thieveryTargets: {
    granary: {
      name: 'Neighbouring Granary',
      flavor: 'A sleepy watchman and a great deal of grain.',
    },
    timberYard: {
      name: 'Timber Yard',
      flavor: 'Stacked planks nobody has counted this week.',
    },
    masonsCompound: {
      name: 'Mason\'s Compound',
      flavor: 'Dressed stone, a dog, and a foreman who sleeps badly.',
    },
    countingHouse: {
      name: 'Counting House',
      flavor: 'Ledgers, a strongbox, and two guards who take turns being awake.',
    },
    templeTreasury: {
      name: 'Temple Treasury',
      flavor: 'Somebody else’s gods, guarded by people who mean it.',
    },
    royalVault: {
      name: 'Royal Vault',
      flavor: 'The kind of job the guild tells stories about, mostly about the funerals.',
    },
  },
  ascensionStages: {
    stage1: {
      name: 'The Foundation',
      flavor: 'You dig until you strike something that will hold a god’s weight.',
    },
    stage2: {
      name: 'The Twin Pillars',
      flavor: 'One for Hai, one for Yah, and no way to tell which is taller.',
    },
    stage3: {
      name: 'The Outer Court',
      flavor: 'Room for everyone who will want to say they were there.',
    },
    stage4: {
      name: 'The Hall of Names',
      flavor: 'Every acre you took, cut into the wall, in the order you took it.',
    },
    stage5: {
      name: 'The Sun Vault',
      flavor: 'A ceiling that holds Hai’s light after Hai has gone down.',
    },
    stage6: {
      name: 'The Shadow Vault',
      flavor: 'Yah’s half, and the reason nobody sleeps in this building.',
    },
    stage7: {
      name: 'The Spire',
      flavor: 'High enough that the argument upstairs becomes audible.',
    },
    stage8: {
      name: 'The Ascension',
      flavor: 'The last stone. You are expected.',
    },
  },
} as const
