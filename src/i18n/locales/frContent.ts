export const FR_CONTENT = {
  resources: {
    food: {
      name: 'nourriture',
      flavor: 'Grain, racines et viande salée. Votre peuple mange, que vous conquériez ou non.',
      gatherAction: 'Fourrager',
    },
    wood: {
      name: 'bois',
      flavor: 'Du bois d’œuvre pour les maisons, les échafaudages et les échelles de siège.',
      gatherAction: 'Couper du bois',
    },
    stone: {
      name: 'pierre',
      flavor: 'Des blocs taillés. Tout ce qui doit vous survivre en est fait.',
      gatherAction: 'Ramasser de la pierre',
    },
    gold: {
      name: 'or',
      flavor: 'De la monnaie frappée. Elle achète des outils, du silence et des soldats.',
    },
  },
  races: {
    human: {
      name: 'Humains',
      tagline: 'Nombreux, adaptables, quelconques — et donc difficiles à arrêter.',
      advantages: [
        'Les habitants arrivent 30 % plus vite que chez tout autre peuple',
        'Les bâtiments coûtent 10 % moins cher et se dressent 25 % plus vite',
        'Libre choix de n’importe quel cercle élémentaire',
      ],
      disadvantages: [
        'Aucun talent exceptionnel dans un domaine précis',
        'Aucun accès au Cercle Sombre',
      ],
    },
    dwarf: {
      name: 'Nains',
      tagline: 'La pierre est une langue, et ils la parlent couramment.',
      advantages: [
        'Les mines rendent 60 % d’or en plus',
        'Les carrières rendent 25 % de pierre en plus',
        'Soldats robustes : 20 % de pertes en moins au combat',
      ],
      disadvantages: [
        'Les fermes rendent 15 % de nourriture en moins',
        'Les armées marchent lentement : 25 % de temps en plus pour atteindre une cible',
        'Seuls les Cercles du Feu ou de la Terre les accueillent',
      ],
    },
    undead: {
      name: 'Morts-vivants',
      tagline: 'Ils n’ont pas faim, et ils ne restent pas morts.',
      advantages: [
        'Votre peuple ne mange jamais — les fermes sont inutiles, la famine impossible',
        'Rien de déjà mort ne peut mourir : aucune perte en bataille ni en larcin, même si l’un ou l’autre peut échouer',
        'Maîtrise du Cercle Sombre',
      ],
      disadvantages: [
        'La tombe rend lentement de nouveaux corps : croissance 40 % plus lente',
        'Les temples rendent 20 % d’expérience magique en moins',
        'Les voleurs sont maladroits : 20 % de réussite en moins',
      ],
    },
    elf: {
      name: 'Elfes',
      tagline: 'Ils ont appris les deux chants : celui qui fait croître et celui qui défait.',
      advantages: [
        'Le Cercle Sombre de droit, plus un cercle élémentaire de votre choix',
        'Deux cercles portent bien plus de mana qu’un seul, en réserve comme en récupération',
        'Les temples rendent 50 % d’expérience magique en plus',
        'Les camps de bûcherons rendent 30 % de bois en plus',
      ],
      disadvantages: [
        'Peu nombreux et lents à se multiplier : croissance 25 % plus lente',
        'Étude partagée en deux : chaque cercle atteint plus tard ses sorts profonds',
        'Les mines rendent 20 % d’or en moins',
        'Fragiles au combat : 25 % de pertes en plus',
      ],
    },
  },
  buildings: {
    house: {
      name: 'Maison',
      flavor: 'Quatre murs et un âtre. Augmente le nombre d’habitants que votre terre peut tenir.',
    },
    farm: {
      name: 'Ferme',
      flavor: 'Des champs labourés. Affectez-y des habitants.',
      workerRole: 'fermiers',
      workerRoleSingular: 'fermier',
    },
    lumberCamp: {
      name: 'Camp de bûcherons',
      flavor: 'Des haches, des traîneaux et une aire d’abattage.',
      workerRole: 'bûcherons',
      workerRoleSingular: 'bûcheron',
    },
    quarry: {
      name: 'Carrière',
      flavor: 'Un front de roche entamé, et la poussière qui va avec.',
      workerRole: 'carriers',
      workerRoleSingular: 'carrier',
    },
    mine: {
      name: 'Mine',
      flavor: 'Un puits creusé à la poursuite d’un filon.',
      workerRole: 'mineurs',
      workerRoleSingular: 'mineur',
    },
    barracks: {
      name: 'Caserne',
      flavor:
        'Cour d’exercice et couchettes. Les habitants affectés entraînent et tiennent des soldats prêts.',
      workerRole: 'instructeurs',
      workerRoleSingular: 'instructeur',
    },
    thievesGuild: {
      name: 'Guilde des voleurs',
      flavor:
        'Une porte discrète dans une rue bruyante. Les habitants affectés font tourner le réseau.',
      workerRole: 'receleurs',
      workerRoleSingular: 'receleur',
    },
    temple: {
      name: 'Temple',
      flavor: 'Deux autels, pour Hai et pour Yah. Les habitants affectés étudient, et les cercles répondent.',
      workerRole: 'prêtres',
      workerRoleSingular: 'prêtre',
    },
  },
  magicCircles: {
    fire: {
      name: 'Cercle du Feu',
      flavor: 'La moitié du ciel qui revient à Hai : le soleil qui mûrit et la flamme qui achève.',
    },
    air: {
      name: 'Cercle de l’Air',
      flavor: 'Tout va plus vite quand le vent est de votre côté.',
    },
    water: {
      name: 'Cercle de l’Eau',
      flavor: 'Pluie, puits et marées. Le cercle qui nourrit un peuple qui grandit.',
    },
    earth: {
      name: 'Cercle de la Terre',
      flavor: 'La pierre répond lentement, mais elle répond, et elle ne rompt pas.',
    },
    dark: {
      name: 'Cercle Sombre',
      flavor: 'La moitié de Yah : le registre où une chose s’échange contre une autre.',
    },
  },
  spells: {
    'fire.sunlight': {
      name: 'Lumière du Jour',
      description: 'Hai se penche un peu, et les fermes rendent 60 % de plus.',
    },
    'fire.forgeFire': {
      name: 'Feu de Forge',
      description: 'Les fonderies chauffent à blanc, et les mines rendent 70 % de plus.',
    },
    'fire.immolate': {
      name: 'Immolation',
      description:
        'Vos soldats entrent en flammes. La puissance d’attaque triple le temps que ça dure — envoyez-les maintenant.',
    },
    'fire.wildfire': {
      name: 'Incendie',
      description:
        'Met le feu aux champs de la prochaine cible avant votre arrivée : sa défense −40 %.',
    },
    'fire.solarZenith': {
      name: 'Zénith Solaire',
      description: 'Un midi qui ne finit pas. Fermes et mines rendent 120 % de plus.',
    },
    'fire.phoenixPyre': {
      name: 'Bûcher du Phénix',
      description: 'La moitié de ceux tombés à votre dernière bataille ressortent des cendres.',
    },
    'air.windmill': {
      name: 'Moulin à Vent',
      description: 'Un vent régulier dans les ailes, et les fermes rendent 60 % de plus.',
    },
    'air.tailwind': {
      name: 'Vent Arrière',
      description: 'Armées et voleurs se déplacent 80 % plus vite.',
    },
    'air.haste': {
      name: 'Hâte',
      description: 'Chaque main va plus vite : toute la production +50 %.',
    },
    'air.whisperingWinds': {
      name: 'Vents Murmurants',
      description:
        'Le vent dit à vos voleurs où sont les gardes : le prochain coup a deux fois plus de chances de réussir.',
    },
    'air.stormFront': {
      name: 'Front d’Orage',
      description:
        'Une armée chevauche la tempête : vitesse de marche doublée et défense ennemie −25 %.',
    },
    'air.timelessGale': {
      name: 'Bourrasque Immobile',
      description: 'Le vent retient son souffle : toute la production doublée.',
    },
    'water.irrigation': {
      name: 'Irrigation',
      description: 'Les canaux sont pleins, et les fermes rendent 70 % de plus.',
    },
    'water.cleansingRain': {
      name: 'Pluie Purifiante',
      description: 'La maladie quitte les rues et les maisons vides se remplissent.',
    },
    'water.deepWell': {
      name: 'Puits Profond',
      description: 'Nourriture +45 %, et les maisons tiennent un quart de plus.',
    },
    'water.tideOfPlenty': {
      name: 'Marée d’Abondance',
      description: 'Le grenier déborde de poisson : la nourriture stockée double, jusqu’à une limite.',
    },
    'water.mistVeil': {
      name: 'Voile de Brume',
      description: 'Votre prochain coup se fait dans le brouillard : pertes −85 %.',
    },
    'water.wellspring': {
      name: 'Source Vive',
      description: 'Une source qui ne tarit pas : fermes doublées.',
    },
    'earth.stoneshaping': {
      name: 'Façonnage de la Pierre',
      description: 'Le front se fend là où vous le demandez : carrières +70 %.',
    },
    'earth.veinsOfOre': {
      name: 'Filons de Minerai',
      description: 'L’or se montre dans la roche : mines +70 %.',
    },
    'earth.bulwark': {
      name: 'Rempart',
      description:
        'La pierre se referme sur vos rangs : ils ne perdent presque personne. Marchez tant que ça tient.',
    },
    'earth.terraform': {
      name: 'Façonner la Terre',
      description:
        'Soulève un nouvel acre hors de la mer, payé en pierre et en bois dont le prix monte avec chaque acre déjà tenu.',
    },
    'earth.livingStone': {
      name: 'Pierre Vivante',
      description: 'Les murs se dressent d’eux-mêmes — six fois le rythme, pendant dix minutes.',
    },
    'earth.mountainsHeart': {
      name: 'Cœur de la Montagne',
      description: 'Carrières et mines rendent 120 % de plus.',
    },
    'dark.blight': {
      name: 'Flétrissure',
      description:
        'La pourriture dans leurs réserves avant le premier jet de lance : défense de la prochaine cible −35 %.',
    },
    'dark.transmute': {
      name: 'Transmutation',
      description:
        'Yah tient un registre : un dixième de votre plus grande réserve est dépensé, et tout le reste monte d’une part de ce montant. Un cercle plus profond perd moins dans l’échange, et au plus profond il y gagne.',
    },
    'dark.sacrifice': {
      name: 'Sacrifice',
      description:
        'Un dixième de votre peuple est donné à Yah, et une heure du travail qu’il aurait accompli revient d’un coup — plus votre royaume produit, plus l’offrande est riche.',
    },
    'dark.barrowLegion': {
      name: 'Légion des Tertres',
      description:
        'Yah ouvre les tertres, et pendant dix minutes vos casernes tiennent deux fois plus de soldats. Recrutez et marchez sans attendre — à la fin, tout soldat au-delà de votre véritable capacité déserte, mais une armée déjà en campagne est épargnée jusqu’à son retour.',
    },
    'dark.soulHarvest': {
      name: 'Moisson des Âmes',
      description: 'Chaque ennemi qui tombe le paie : le butin vaut six fois plus.',
    },
    'dark.pactOfHaiAndYah': {
      name: 'Pacte de Hai et Yah',
      description:
        'Les deux dieux marchent avec vous, et le prix est tout autre sort : production et attaque doublent, et aucun mana ne revient tant que le pacte tient.',
    },
  },
  upgradeLines: {
    housing: {
      name: 'Logement',
      flavor: 'De meilleurs murs tiennent plus de monde sur le même acre.',
    },
    farming: {
      name: 'Agriculture',
      flavor: 'Des outils et une méthode entre vous et la famine.',
    },
    woodcutting: {
      name: 'Bûcheronnage',
      flavor: 'Acier plus tranchant, moins de coups.',
    },
    quarrying: {
      name: 'Extraction de pierre',
      flavor: 'Fendre la roche est un métier, pas une corvée.',
    },
    mining: {
      name: 'Mines',
      flavor: 'Puits plus profonds, filons plus riches.',
    },
    preservation: {
      name: 'Conservation',
      flavor: 'La nourriture qui se garde est celle que vous n’avez pas perdue.',
    },
    logistics: {
      name: 'Logistique',
      flavor: 'Les routes rendent toutes les autres améliorations plus utiles.',
    },
    masonry: {
      name: 'Maçonnerie',
      flavor: 'N’importe qui peut empiler des pierres. Le faire vite est un métier.',
    },
    military: {
      name: 'Militaire',
      flavor: 'Exercice, discipline et machines de guerre.',
    },
    command: {
      name: 'Commandement',
      flavor: 'Des officiers à qui confier une armée entière.',
    },
    thievery: {
      name: 'Larcin',
      flavor: 'Le métier discret, pratiqué comme il faut.',
    },
    arcana: {
      name: 'Arcanes',
      flavor: 'Des instruments et des bibliothèques pour les cercles.',
    },
    gathering: {
      name: 'Récolte',
      flavor: 'Vos deux mains, mieux employées.',
    },
    fortification: {
      name: 'Fortification',
      flavor: 'D’interminables petits renforts. Répétable.',
    },
    bribery: {
      name: 'Corruption',
      flavor: 'De la monnaie dans la bonne paume, encore et encore. Répétable.',
    },
  },
  upgrades: {
    'housing.timberFrames': {
      name: 'Charpentes',
      flavor: 'Une vraie charpente au lieu de perches liées.',
    },
    'housing.stoneHouses': {
      name: 'Maisons de pierre',
      flavor: 'Pierre taillée, deux étages, un vrai toit.',
    },
    'housing.manorHalls': {
      name: 'Halles seigneuriales',
      flavor: 'De longues salles où dorment des familles entières.',
    },
    'farming.ironPlows': {
      name: 'Charrues de fer',
      flavor: 'Le fer tranche la motte que le soc de bois ne faisait que meurtrir.',
    },
    'farming.cropRotation': {
      name: 'Rotation des cultures',
      flavor: 'Laissez un champ se reposer et il vous le rend.',
    },
    'farming.aqueducts': {
      name: 'Aqueducs',
      flavor: 'L’eau arrive, qu’il pleuve ou non.',
    },
    'woodcutting.bronzeAxes': {
      name: 'Haches de bronze',
      flavor: 'Des fers coulés qui gardent leur tranchant.',
    },
    'woodcutting.steelAxes': {
      name: 'Haches d’acier',
      flavor: 'Moitié moins de coups, deux fois plus d’arbres.',
    },
    'woodcutting.whipsaws': {
      name: 'Scies passe-partout',
      flavor: 'Des scies à deux hommes et une aire d’abattage qui ne s’arrête jamais.',
    },
    'quarrying.ironChisels': {
      name: 'Ciseaux de fer',
      flavor: 'La pierre se fend là où vous la marquez.',
    },
    'quarrying.wedgeAndFeather': {
      name: 'Coins et plumes',
      flavor: 'Une astuce de fer qui ouvre un front proprement.',
    },
    'quarrying.cranes': {
      name: 'Grues à roue',
      flavor: 'Les blocs quittent la fosse aussi vite qu’on les taille.',
    },
    'mining.ironPicks': {
      name: 'Pics de fer',
      flavor: 'Le fer mord là où le bronze glisse.',
    },
    'mining.steelPicks': {
      name: 'Pics d’acier',
      flavor: 'Des têtes trempées et un forgeron pour les tenir.',
    },
    'mining.blastingPowder': {
      name: 'Poudre de mine',
      flavor: 'Une charge fait en un battement de cœur ce qu’un poste entier ne pouvait.',
    },
    'preservation.rootCellars': {
      name: 'Caves à racines',
      flavor: 'La terre froide garde une récolte honnête.',
    },
    'preservation.granaries': {
      name: 'Greniers',
      flavor: 'Planchers surélevés, couvercles serrés, aucune vermine.',
    },
    'preservation.coldVaults': {
      name: 'Glacières',
      flavor: 'De la glace taillée en hiver, gardée toute l’année.',
    },
    'logistics.handcarts': {
      name: 'Charrettes à bras',
      flavor: 'Personne ne devrait porter ce qu’une roue peut porter.',
    },
    'logistics.wagons': {
      name: 'Chariots',
      flavor: 'Attelages et essieux.',
    },
    'logistics.pavedRoads': {
      name: 'Routes pavées',
      flavor: 'De la pierre sous chaque roue du royaume.',
    },
    'masonry.workCrews': {
      name: 'Équipes de chantier',
      flavor: 'Des équipes qui connaissent l’ordre des travaux.',
    },
    'masonry.scaffolding': {
      name: 'Échafaudages',
      flavor: 'Plus personne n’attend une échelle.',
    },
    'masonry.masterBuilders': {
      name: 'Maîtres bâtisseurs',
      flavor: 'Ils en ont dressé cent avant celui-là.',
    },
    'military.drillYards': {
      name: 'Cours d’exercice',
      flavor: 'Des soldats qui l’ont déjà fait.',
    },
    'military.standingArmy': {
      name: 'Armée permanente',
      flavor: 'Payée, logée, toujours prête.',
    },
    'military.siegeEngines': {
      name: 'Machines de siège',
      flavor: 'Les murs cessent d’être un argument.',
    },
    'command.warCaptains': {
      name: 'Capitaines de guerre',
      flavor: 'Une deuxième colonne, et quelqu’un pour la mener.',
    },
    'command.warGenerals': {
      name: 'Généraux de guerre',
      flavor: 'Trois campagnes à la fois, et aucune à surveiller toi-même.',
    },
    'thievery.lockpicks': {
      name: 'Passe-partout',
      flavor: 'Un jeu de crochets et quelqu’un qui sait s’en servir.',
    },
    'thievery.smokeBombs': {
      name: 'Bombes fumigènes',
      flavor: 'Une sortie vaut mieux qu’une entrée.',
    },
    'thievery.guildNetwork': {
      name: 'Réseau de la guilde',
      flavor: 'Des yeux dans chaque cité que vous n’avez pas encore prise.',
    },
    'arcana.scriptoria': {
      name: 'Scriptoria',
      flavor: 'Quelqu’un a enfin pris des notes.',
    },
    'arcana.astrolabes': {
      name: 'Astrolabes',
      flavor: 'Hai et Yah mesurés à l’aune des étoiles.',
    },
    'arcana.leyLines': {
      name: 'Lignes telluriques',
      flavor: 'Les cercles n’attendent plus vos temples.',
    },
    'gathering.callousedHands': {
      name: 'Mains calleuses',
      flavor: 'Vous faites ça depuis un moment.',
    },
    'gathering.practisedHands': {
      name: 'Mains exercées',
      flavor: 'Moins de gestes perdus.',
    },
    'gathering.masterGatherers': {
      name: 'Maîtres récolteurs',
      flavor: 'Une équipe qui va où vous pointez.',
    },
    'fortification.reinforceWalls': {
      name: 'Renforcer les murs',
      flavor: 'Une assise de pierre en plus, quelques soldats de plus rentrés.',
    },
    'bribery.guildBribes': {
      name: 'Pots-de-vin de la guilde',
      flavor: 'De la monnaie dans la bonne paume, sans qu’aucun coup soit jamais sûr.',
    },
  },
  conquestTargets: {
    hamlet: {
      name: 'Hameau isolé',
      flavor: 'Onze familles et une palissade. Ils ne tiendront pas.',
    },
    village: {
      name: 'Village au bord de l’eau',
      flavor: 'Un moulin, un sanctuaire, et des hommes qui ont déjà repoussé des pillards.',
    },
    town: {
      name: 'Ville fortifiée',
      flavor: 'Un fossé, une porte et une garnison payée à l’heure.',
    },
    city: {
      name: 'Cité libre',
      flavor: 'Des tours, un guet permanent, et un conseil qui ne traitera pas avec vous.',
    },
    capital: {
      name: 'Capitale rivale',
      flavor: 'Un trône qui n’a jamais été pris. Son armée est de métier.',
    },
    twinThrones: {
      name: 'Les Trônes Jumeaux',
      flavor:
        'Le siège où Hai et Yah se disputent, dit-on. Qui le tient tient les derniers acres libres du monde.',
    },
  },
  thieveryTargets: {
    granary: {
      name: 'Grenier voisin',
      flavor: 'Un gardien somnolent et beaucoup de grain.',
    },
    timberYard: {
      name: 'Chantier de bois',
      flavor: 'Des planches empilées que personne n’a comptées cette semaine.',
    },
    masonsCompound: {
      name: 'Enclos du maçon',
      flavor: 'De la pierre taillée, un chien, et un contremaître qui dort mal.',
    },
    countingHouse: {
      name: 'Comptoir',
      flavor: 'Des registres, un coffre, et deux gardes qui veillent à tour de rôle.',
    },
    templeTreasury: {
      name: 'Trésor du temple',
      flavor: 'Les dieux de quelqu’un d’autre, gardés par des gens qui y croient.',
    },
    royalVault: {
      name: 'Chambre forte royale',
      flavor: 'Le genre de coup dont la guilde fait des récits, surtout à propos des enterrements.',
    },
  },
  ascensionStages: {
    stage1: {
      name: 'Les Fondations',
      flavor: 'Vous creusez jusqu’à trouver ce qui portera le poids d’un dieu.',
    },
    stage2: {
      name: 'Les Piliers Jumeaux',
      flavor: 'Un pour Hai, un pour Yah, et rien pour dire lequel est le plus haut.',
    },
    stage3: {
      name: 'La Cour Extérieure',
      flavor: 'De la place pour tous ceux qui voudront dire qu’ils y étaient.',
    },
    stage4: {
      name: 'La Salle des Noms',
      flavor: 'Chaque acre pris, gravé dans le mur, dans l’ordre où vous l’avez pris.',
    },
    stage5: {
      name: 'La Voûte du Soleil',
      flavor: 'Un plafond qui retient la lumière de Hai après le coucher de Hai.',
    },
    stage6: {
      name: 'La Voûte de l’Ombre',
      flavor: 'La moitié de Yah, et la raison pour laquelle personne ne dort dans ce bâtiment.',
    },
    stage7: {
      name: 'La Flèche',
      flavor: 'Assez haut pour que la dispute d’en haut devienne audible.',
    },
    stage8: {
      name: 'L’Ascension',
      flavor: 'La dernière pierre. On vous attend.',
    },
  },
} as const
