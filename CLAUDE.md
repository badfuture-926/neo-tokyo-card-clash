# Neo Tokyo Card Clash - Development Guidelines

## Project Overview
Strategic NFT card battler built with React 18 + TypeScript + Vite + Tailwind CSS. NFT collection integration via Alchemy API. Single-file architecture (`App.tsx`) until >2000 lines.

## Critical Balance Rules (Never Break These)

1. **Anti-Snowball Damage Formula (SACRED)**
   - Winner loses loser's value: `winnerNew = winnerOld - loserValue`
   - Loser loses winner's value: `loserNew = max(0, loserOld - winnerValue)`
   - Strong cards MUST weaken after victories. This is non-negotiable.

2. **Trait Scoring Accuracy**
   - Interlinked string traits: Use `traitScores.json` for 0-100 normalization
   - Never hardcode rarity values
   - Formula: `Score = 100 × (max_count - trait_count) / (max_count - min_count)`

3. **One-Time Summon Abilities**
   - Dark Lord, Angelic Overlord, Angie: Each usable once per game per player
   - Effects: Dark Lord (-50% target, -10% self), Angelic (+50% target, +10% opponent), Angie (resurrect at 80%)
   - Never allow multiple uses or ability stacking

4. **Graveyard Original Traits**
   - Store eliminated cards with `originalTraits` from game start (pristine values)
   - Resurrection always at 80% of original, rounded up: `Math.ceil(original * 0.8)`
   - Never use current weakened values for resurrection

5. **Timer Behavior (Strict)**
   - Runs: During player decisions + CONFIRM ATTACK modal
   - Stops: When INITIATE CLASH clicked
   - Hidden: During opponent's turn
   - Resets: To 30 seconds at start of each player turn

## Visual Feedback Requirements

**All targeting must include:**
- Targeting line (Gold=attack, Purple=Dark Lord, Blue=Angelic, Green glow=resurrect)
- Highlight on target card (Red=attack, Purple=Dark Lord, Blue=Angelic, Green=resurrect)
- Flash effect showing stat change ("+50%", "-10%", "RESURRECTED")

## AI Behavior Standards

- Strategic decision-making, not random
- Dark Lord: Target visually strongest player card (Helm/Apparel/Weapon/Location rarity)
- Angelic: 50/50 → buff strongest OR save weakest
- Angie: Resurrect when 2+ cards dead, choose highest original trait total
- Use abilities based on game state, not turn count

## Code Architecture Rules

- **No component splitting** until App.tsx exceeds 2000 lines
- **No external state management** (Redux, Zustand, etc.) - use useState only
- **State preservation:** Always store both `citizenTraits` (working) and `originalCitizenTraits` (pristine)
- **Cleanup:** All intervals/timeouts must have cleanup in useEffect returns
- **Type safety:** Maintain TypeScript strict mode compliance

## Development Workflow

1. **Test before commit** - Every feature tested in isolation
2. **Git commit** before adding new features
3. **Console logging** for debugging (removable later)
4. **No greedy multi-feature commits**

## Performance Constraints

- Max 24 cards loaded per game (12 player, 12 opponent)
- Images lazy-loaded from CDN: `https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/{id}.png`
- Timer intervals properly cleaned up
- No unnecessary re-renders during battles

## Data Sources

- **Alchemy API Key:** `0uBM1JotEbL5ERgVwcDEa`
- **Contract:** `0xb9951b43802dcf3ef5b14567cb17adf367ed1c0f`
- **Trait Scores:** `/mnt/user-data/uploads/traitScores.json`

## Quick Reference

**Card Elimination Thresholds:**
- Interlinked: 6 of 12 traits at 0
- Last Citizen Standing: 3 of 6 traits at 0

**Win/Lose:**
- Victory: `opponentDeck.length === 0`
- Defeat: `playerDeck.length === 0`

**Balance Targets:**
- Games: 15-25 turns
- Skill > RNG: 60-70% win rate for better player

## When in Doubt

Refer to `docs/game-mechanics.md` for detailed mechanics explanations. For UX/design decisions, prioritize: (1) Visual transparency, (2) Strategic depth, (3) Anti-snowball preservation.