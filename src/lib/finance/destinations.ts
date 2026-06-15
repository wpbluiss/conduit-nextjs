// Cadence picks a surprise trip that fits what you saved. Higher budget → farther.
type Dest = { destination: string; blurb: string; emoji: string };

const TIERS: { max: number; picks: Dest[] }[] = [
  {
    max: 800,
    picks: [
      { destination: "Key West, Florida", blurb: "Sunset sails, Duval St, and conch fritters.", emoji: "🌴" },
      { destination: "Savannah, Georgia", blurb: "Spanish moss, cobblestones, and slow Southern charm.", emoji: "🌳" },
      { destination: "Asheville, North Carolina", blurb: "Blue Ridge views, breweries, and hot springs.", emoji: "🏞️" },
      { destination: "San Antonio, Texas", blurb: "The River Walk, tacos, and warm nights.", emoji: "🌮" },
    ],
  },
  {
    max: 2000,
    picks: [
      { destination: "Cancún, Mexico", blurb: "Turquoise water, all-inclusive, zero worries.", emoji: "🏝️" },
      { destination: "San Juan, Puerto Rico", blurb: "Old San Juan color, beaches, no passport needed.", emoji: "🇵🇷" },
      { destination: "New Orleans, Louisiana", blurb: "Jazz, beignets, and the French Quarter.", emoji: "🎷" },
      { destination: "Sedona, Arizona", blurb: "Red rocks, stargazing, and desert spa days.", emoji: "🏜️" },
    ],
  },
  {
    max: 4000,
    picks: [
      { destination: "Aruba", blurb: "White sand, steady trade winds, happy island.", emoji: "🐠" },
      { destination: "Costa Rica", blurb: "Rainforest, volcanoes, and Pura Vida.", emoji: "🦥" },
      { destination: "Maui, Hawaii", blurb: "Road to Hana, black-sand beaches, luaus.", emoji: "🌺" },
      { destination: "Turks & Caicos", blurb: "The clearest water you'll ever float in.", emoji: "🐚" },
    ],
  },
  {
    max: Infinity,
    picks: [
      { destination: "Santorini, Greece", blurb: "Whitewashed cliffs over the bluest sea.", emoji: "🇬🇷" },
      { destination: "Amalfi Coast, Italy", blurb: "Lemon groves, cliffside towns, pasta by the sea.", emoji: "🍋" },
      { destination: "Bora Bora", blurb: "Overwater bungalow. Need we say more.", emoji: "🏖️" },
      { destination: "Tokyo, Japan", blurb: "Neon, temples, the best food on earth.", emoji: "🗼" },
    ],
  },
];

export function pickMysteryDestination(budget: number): Dest {
  const tier = TIERS.find((t) => budget <= t.max) ?? TIERS[TIERS.length - 1];
  return tier.picks[Math.floor(Math.random() * tier.picks.length)];
}
