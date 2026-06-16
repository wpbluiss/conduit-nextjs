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
      { destination: "Cancún, Mexico", blurb: "Turquoise water, all-inclusive, zero worries.", emoji: "🏝️" },
      { destination: "Turks & Caicos", blurb: "The clearest water you'll ever float in.", emoji: "🐚" },
    ],
  },
  {
    max: Infinity,
    picks: [
      { destination: "Maui, Hawaii", blurb: "Road to Hana, black-sand beaches, luaus.", emoji: "🌺" },
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

// Non-spoiler teaser hints, by budget tier — build anticipation as the jar fills.
const HINTS: { max: number; hints: string[] }[] = [
  { max: 800, hints: ["Within a tank of gas ⛽", "Cobblestones & charm", "A long-weekend escape"] },
  { max: 2000, hints: ["Pack flip-flops 🩴", "Somewhere warm…", "Passport optional 🛂"] },
  { max: 4000, hints: ["The water will be CLEAR 🐠", "Definitely tropical ☀️", "Bring the good camera 📸"] },
  { max: Infinity, hints: ["Dust off the passport ✈️", "Across an ocean 🌊", "Trip-of-a-lifetime vibes ✨"] },
];

export function mysteryHints(budget: number): string[] {
  return (HINTS.find((t) => budget <= t.max) ?? HINTS[HINTS.length - 1]).hints;
}

// Fake destinations to "spin" through during the reveal animation.
export const SPIN_NAMES = [
  "Cancún", "Tokyo", "Aruba", "Santorini", "Maui", "Costa Rica",
  "Bora Bora", "Key West", "Amalfi", "Turks & Caicos", "Sedona", "San Juan",
];

