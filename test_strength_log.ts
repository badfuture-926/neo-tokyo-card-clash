type CitizenTraits = {
  strength: number;
  intelligence: number;
  cool: number;
  techSkill: number;
  attractiveness: number;
  race: string;
}

const citizenTraits: Record<number, CitizenTraits> = {
  1: { strength: 55, intelligence: 10, cool: 10, techSkill: 10, attractiveness: 10, race: 'Human' },
  2: { strength: 40, intelligence: 10, cool: 10, techSkill: 10, attractiveness: 10, race: 'Demon' }
};
const playerScores = { strength: 55 };
const opponentScores = { strength: 40 };
const trait = 'strength';

let pDisplay: string | number = playerScores[trait];
let oDisplay: string | number = opponentScores[trait];

if (citizenTraits[1]) {
  const raw = citizenTraits[1][trait as keyof CitizenTraits];
  console.log('Player Raw Strength:', raw);
  if (raw !== undefined) pDisplay = raw;
}
console.log('Final P Display:', pDisplay);
