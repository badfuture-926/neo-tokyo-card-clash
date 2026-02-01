import rareTraitsData from './rareTraits.json'

// Create a Set for fast lookup of rare traits
const rareTraitSet = new Set<string>()
const ultraRareTraitSet = new Set<string>() // <1% traits (gold)
const traitCountMap = new Map<string, number>() // Map for actual counts

// Populate the sets with all rare trait combinations
Object.entries(rareTraitsData).forEach(([traitType, values]) => {
  values.forEach((trait: { value: string, percentage: string, count: number }) => {
    const key = `${traitType}:${trait.value}`
    const percentage = parseFloat(trait.percentage)
    
    // Store actual count
    traitCountMap.set(key, trait.count)
    
    // Ultra rare: <1%
    if (percentage < 1) {
      ultraRareTraitSet.add(key)
    }
    // Regular rare: <5%
    rareTraitSet.add(key)
  })
})

export function getTraitCount(traitType: string, value: string | number): number {
  const key = `${traitType}:${value}`
  return traitCountMap.get(key) || 9999 // Return high number if not found (common trait)
}

export function isRareTrait(traitType: string, value: string | number): boolean {
  // For numerical stats, 80-94 is rare (purple)
  const numericalTraits = ['Strength', 'Intelligence', 'Cool', 'Tech Skill', 'Attractiveness']
  if (numericalTraits.includes(traitType)) {
    const numValue = Number(value)
    return numValue >= 80 && numValue <= 94
  }
  
  // For non-numerical, check if it's rare but not ultra-rare
  const key = `${traitType}:${value}`
  return rareTraitSet.has(key) && !ultraRareTraitSet.has(key)
}

export function isUltraRareTrait(traitType: string, value: string | number): boolean {
  // For numerical stats, 95-100 is ultra rare (gold)
  const numericalTraits = ['Strength', 'Intelligence', 'Cool', 'Tech Skill', 'Attractiveness']
  if (numericalTraits.includes(traitType)) {
    const numValue = Number(value)
    return numValue >= 95 && numValue <= 100
  }
  
  // For non-numerical, check if it's <1% (ultra rare)
  const key = `${traitType}:${value}`
  return ultraRareTraitSet.has(key)
}
