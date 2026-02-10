import React, { useState, useEffect, useRef } from 'react'
import './style.css'
import { isRareTrait, isUltraRareTrait, getTraitCount } from './rareTraits'
import traitScores from './assets/traitScores.json'

interface CitizenCard {
  id: number
  loaded: boolean
}

interface CitizenTraits {
  class: string
  race: string
  strength: number
  intelligence: number
  attractiveness: number
  techSkill: number
  cool: number
  eyes: string
  ability: string
  location: string
  additionalItem: string
  weapon: string
  vehicle: string
  apparel: string
  helm: string
  rewardRate: string
}

interface CardTraitScores {
  race: number
  class: number
  eyes: number
  ability: number
  additionalItem: number
  helm: number
  location: number
  vehicle: number
  apparel: number
  rewardRate: number
  weapon: number
  strength: number
}

interface GraveyardCard {
  id: number
  eliminatedTurn: number
  originalTraits: CitizenTraits
}

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showGameModes, setShowGameModes] = useState(false)
  const [gameMode, setGameMode] = useState<'omnipresent' | 'chaotic' | 'threat-intelligence' | 'last-citizen-standing' | 'interlinked' | null>(null)
  const [citizens, setCitizens] = useState<CitizenCard[]>([])
  const [citizenTraits, setCitizenTraits] = useState<Record<number, CitizenTraits>>({})
  const citizenTraitsRef = useRef(citizenTraits)
  citizenTraitsRef.current = citizenTraits

  const discardMessageShown = useRef(false)

  // Get available traits based on game mode
  const getTraitKey = (label: string): string => {
    // Map display labels to JSON keys for rarity lookup
    const labelToKey: { [key: string]: string } = {
      'Class': 'Class',
      'Race': 'Race',
      'Eyes': 'Eyes',
      'Location': 'Location',
      'Item': 'Additional Item',  // Key difference!
      'Weapon': 'Weapon',
      'Vehicle': 'Vehicle',
      'Apparel': 'Apparel',
      'Helm': 'Helm',
      'Reward': 'Reward Rate',    // Key difference!
      'Ability': 'Ability',
      'Strength': 'Strength',
      'Intelligence': 'Intelligence',
      'Cool': 'Cool',
      'Tech Skill': 'Tech Skill',
      'Attractiveness': 'Attractiveness'
    }
    return labelToKey[label] || label
  }

  const getAvailableTraits = () => {
    if (gameMode === 'last-citizen-standing') {
      // Last Citizen Standing: Only 6 numeric traits
      return [
        { label: 'Strength', value: 'strength', key: 'Strength' },
        { label: 'Intelligence', value: 'intelligence', key: 'Intelligence' },
        { label: 'Cool', value: 'cool', key: 'Cool' },
        { label: 'Tech Skill', value: 'techSkill', key: 'Tech Skill' },
        { label: 'Attractiveness', value: 'attractiveness', key: 'Attractiveness' },
        { label: 'Reward', value: 'rewardRate', key: 'Reward Rate' }
      ]
    }

    if (gameMode === 'interlinked') {
      // INTERLINKED mode: 12 traits (same as Chaotic/Threat Intel)
      return [
        { label: 'Race', value: 'race', key: 'Race' },
        { label: 'Class', value: 'class', key: 'Class' },
        { label: 'Eyes', value: 'eyes', key: 'Eyes' },
        { label: 'Ability', value: 'ability', key: 'Ability' },
        { label: 'Item', value: 'additionalItem', key: 'Additional Item' },
        { label: 'Helm', value: 'helm', key: 'Helm' },
        { label: 'Location', value: 'location', key: 'Location' },
        { label: 'Vehicle', value: 'vehicle', key: 'Vehicle' },
        { label: 'Apparel', value: 'apparel', key: 'Apparel' },
        { label: 'Reward', value: 'rewardRate', key: 'Reward Rate' },
        { label: 'Weapon', value: 'weapon', key: 'Weapon' },
        { label: 'Strength', value: 'strength', key: 'Strength' }
      ]
    }

    if (gameMode === 'chaotic' || gameMode === 'threat-intelligence') {
      // Chaotic and Threat Intelligence modes: only 12 traits, Strength is the only numeric trait
      return [
        { label: 'Class', value: 'class', key: 'Class' },
        { label: 'Race', value: 'race', key: 'Race' },
        { label: 'Strength', value: 'strength', key: 'Strength' },
        { label: 'Eyes', value: 'eyes', key: 'Eyes' },
        { label: 'Ability', value: 'ability', key: 'Ability' },
        { label: 'Location', value: 'location', key: 'Location' },
        { label: 'Item', value: 'additionalItem', key: 'Additional Item' },
        { label: 'Weapon', value: 'weapon', key: 'Weapon' },
        { label: 'Vehicle', value: 'vehicle', key: 'Vehicle' },
        { label: 'Apparel', value: 'apparel', key: 'Apparel' },
        { label: 'Helm', value: 'helm', key: 'Helm' },
        { label: 'Reward', value: 'rewardRate', key: 'Reward Rate' }
      ]
    }

    // Omnipresent: all 16 traits
    return [
      { label: 'Class', value: 'class', key: 'Class' },
      { label: 'Race', value: 'race', key: 'Race' },
      { label: 'Eyes', value: 'eyes', key: 'Eyes' },
      { label: 'Location', value: 'location', key: 'Location' },
      { label: 'Item', value: 'additionalItem', key: 'Additional Item' },
      { label: 'Weapon', value: 'weapon', key: 'Weapon' },
      { label: 'Vehicle', value: 'vehicle', key: 'Vehicle' },
      { label: 'Apparel', value: 'apparel', key: 'Apparel' },
      { label: 'Helm', value: 'helm', key: 'Helm' },
      { label: 'Reward', value: 'rewardRate', key: 'Reward Rate' },
      { label: 'Ability', value: 'ability', key: 'Ability' },
      { label: 'Strength', value: 'strength', key: 'Strength' },
      { label: 'Intelligence', value: 'intelligence', key: 'Intelligence' },
      { label: 'Cool', value: 'cool', key: 'Cool' },
      { label: 'Tech Skill', value: 'techSkill', key: 'Tech Skill' },
      { label: 'Attractiveness', value: 'attractiveness', key: 'Attractiveness' }
    ]
  }

  const showFlashEffect = (cardId: number, text: string, color: 'red' | 'green') => {
    setCardFlashEffects(prev => ({
      ...prev,
      [cardId]: { text, color, timestamp: Date.now() }
    }))

    setTimeout(() => {
      setCardFlashEffects(prev => {
        const newEffects = { ...prev }
        delete newEffects[cardId]
        return newEffects
      })
    }, 1500)
  }

  const opponentConsiderSummonAbility = () => {
    // Randomized evaluation order — prevents predictable DL-first opener
    const abilities = ['dark-lord', 'angelic-overlord', 'angie'] as const
    const shuffled = [...abilities].sort(() => Math.random() - 0.5)

    for (const ability of shuffled) {
      // DARK LORD — Target player's strongest visible card
      // 10% penalty on all AI cards is costly early game (9 cards × 10% = 90% total loss)
      // Only worth it when AI is losing or mid-late game when fewer cards remain
      if (ability === 'dark-lord' && !opponentDarkLordUsed && playerDeck.length > 0) {
        const aiLosing = opponentDeck.length < playerDeck.length
        const midGame = opponentDeck.length <= 6 || playerDeck.length <= 6
        const desperate = opponentDeck.length <= 3

        // Skip if early game and AI isn't behind
        if (!aiLosing && !midGame) continue

        const strongestPlayerCard = playerDeck.reduce((strongest: number, cardId: number) => {
          const traits = citizenTraits[cardId]
          const strongestTraits = citizenTraits[strongest]
          if (!traits || !strongestTraits) return strongest

          const getCardScore = (t: CitizenTraits) => {
            let score = 0
            if (isUltraRareTrait('Helm', t.helm)) score += 100
            else if (isRareTrait('Helm', t.helm)) score += 50
            else score += 10
            if (isUltraRareTrait('Apparel', t.apparel)) score += 100
            else if (isRareTrait('Apparel', t.apparel)) score += 50
            else score += 10
            if (isUltraRareTrait('Weapon', t.weapon)) score += 100
            else if (isRareTrait('Weapon', t.weapon)) score += 50
            else score += 10
            if (isUltraRareTrait('Location', t.location)) score += 100
            else if (isRareTrait('Location', t.location)) score += 50
            else score += 10
            return score
          }

          return getCardScore(traits) > getCardScore(strongestTraits) ? cardId : strongest
        }, playerDeck[0])

        const shouldUse = desperate || (aiLosing && Math.random() > 0.3) || (midGame && Math.random() > 0.5)
        if (strongestPlayerCard && shouldUse) {
          return { ability: 'dark-lord' as const, targetCard: strongestPlayerCard }
        }
      }

      // ANGELIC OVERLORD — Buff strongest OR save weakest (50/50)
      // +10% penalty on all player cards is costly early game (9 cards × 10% = 90% total buff to opponent)
      // Only worth it when AI is losing or mid-late game when fewer player cards remain
      if (ability === 'angelic-overlord' && !opponentAngelicUsed && opponentDeck.length >= 2) {
        const aiLosing = opponentDeck.length < playerDeck.length
        const midGame = opponentDeck.length <= 6 || playerDeck.length <= 6
        const desperate = opponentDeck.length <= 3

        // Skip if early game and AI isn't behind
        if (!aiLosing && !midGame) continue

        const useOnStrongest = Math.random() > 0.5

        let targetCard
        if (useOnStrongest) {
          targetCard = opponentDeck.reduce((strongest: number, cardId: number) => {
            const traits = citizenTraits[cardId]
            const strongestTraits = citizenTraits[strongest]
            if (!traits || !strongestTraits) return strongest
            const getNumericTotal = (t: CitizenTraits) => Object.values(t).reduce((sum: number, val: any) => {
              const num = typeof val === 'number' ? val : parseFloat(String(val)) || 0
              return sum + num
            }, 0)
            return getNumericTotal(traits) > getNumericTotal(strongestTraits) ? cardId : strongest
          }, opponentDeck[0])
        } else {
          targetCard = opponentDeck.reduce((weakest: number, cardId: number) => {
            const traits = citizenTraits[cardId]
            const weakestTraits = citizenTraits[weakest]
            if (!traits || !weakestTraits) return weakest
            const getZeroCount = (t: CitizenTraits) => Object.values(t).filter((val: any) => {
              const num = typeof val === 'number' ? val : parseFloat(String(val)) || 0
              return num === 0
            }).length
            return getZeroCount(traits) > getZeroCount(weakestTraits) ? cardId : weakest
          }, opponentDeck[0])
        }

        const shouldUse = desperate || (aiLosing && Math.random() > 0.3) || (midGame && Math.random() > 0.5)
        if (targetCard && shouldUse) {
          return { ability: 'angelic-overlord' as const, targetCard }
        }
      }

      // ANGIE — Resurrect best card from graveyard
      if (ability === 'angie' && !opponentAngieUsed && opponentGraveyard.length > 0) {
        const bestDeadCard = opponentGraveyard.reduce((best: GraveyardCard, card: GraveyardCard) => {
          const getNumericTotal = (t: CitizenTraits) => Object.values(t).reduce((sum: number, val: any) => {
            const num = typeof val === 'number' ? val : parseFloat(String(val)) || 0
            return sum + num
          }, 0)
          return getNumericTotal(card.originalTraits) > getNumericTotal(best.originalTraits) ? card : best
        }, opponentGraveyard[0])

        const shouldUse = opponentGraveyard.length >= 2 || opponentDeck.length <= 2
        if (bestDeadCard && shouldUse) {
          return { ability: 'angie' as const, targetCard: bestDeadCard.id }
        }
      }
    }

    return null
  }

  // Game phases
  const [gamePhase, setGamePhase] = useState<'discard' | 'rps' | 'battle'>('discard')
  const [discardedCards, setDiscardedCards] = useState<number[]>([])
  const [playerDeck, setPlayerDeck] = useState<number[]>([])
  const [opponentDeck, setOpponentDeck] = useState<number[]>([])
  const [timer, setTimer] = useState<number>(30)
  const executeOpponentSummonAbility = async (decision: { ability: 'dark-lord' | 'angelic-overlord' | 'angie', targetCard: number }) => {
    if (decision.ability === 'dark-lord') {
      await executeOpponentDarkLord(decision.targetCard)
    } else if (decision.ability === 'angelic-overlord') {
      await executeOpponentAngelic(decision.targetCard)
    } else if (decision.ability === 'angie') {
      await executeOpponentAngie(decision.targetCard)
    }
  }

  const executeOpponentDarkLord = (targetPlayerCard: number) => {
    return new Promise<void>((resolve) => {
      // 1. Highlight opponent's Dark Lord button
      setOpponentActiveSummon('dark-lord')

      // 2. After 200ms, show purple targeting line
      setTimeout(() => {
        setOpponentSummonTarget(targetPlayerCard)

        // 3. After 1 second, apply effects
        setTimeout(() => {
          const targetTraits = citizenTraits[targetPlayerCard]
          if (targetTraits) {
            // Flash "-50%" on player's targeted card
            showFlashEffect(targetPlayerCard, '-50%', 'red')

            // Reduce target's all traits by 50%
            const updatedTraits = { ...targetTraits }
            const numericKeys: (keyof CitizenTraits)[] = ['strength', 'intelligence', 'cool', 'techSkill', 'attractiveness']
            numericKeys.forEach(key => {
              const val = updatedTraits[key]
              const numVal = typeof val === 'number' ? val : parseFloat(String(val)) || 0
              updatedTraits[key] = Math.floor(Math.max(0, numVal * 0.5)) as any
            })
            // Also reward rate
            const reward = parseFloat(String(updatedTraits.rewardRate)) || 0
            updatedTraits.rewardRate = String(Math.floor(reward * 0.5))

            // Update state
            setCitizenTraits(prev => ({ ...prev, [targetPlayerCard]: updatedTraits }))
          }

          // Interlinked: Update cardTraitScores for target (-50%) and opponent's own cards (-10%)
          setCardTraitScores(prev => {
            const newScores = { ...prev }

            // Target player card: -50% all trait scores
            const targetScores = newScores[targetPlayerCard] || getInitialTraitScores(targetPlayerCard)
            if (targetScores) {
              const reduced = { ...targetScores };
              (Object.keys(reduced) as Array<keyof CardTraitScores>).forEach(key => {
                reduced[key] = Math.floor(reduced[key] * 0.5)
              })
              newScores[targetPlayerCard] = reduced
            }

            // Opponent's own cards: -10% all trait scores (self-penalty)
            opponentDeck.forEach(cardId => {
              const scores = newScores[cardId] || getInitialTraitScores(cardId)
              if (scores) {
                const reduced = { ...scores };
                (Object.keys(reduced) as Array<keyof CardTraitScores>).forEach(key => {
                  reduced[key] = Math.floor(reduced[key] * 0.9)
                })
                newScores[cardId] = reduced
              }
            })

            return newScores
          })

          // Flash "-10%" on ALL opponent's cards (penalty)
          opponentDeck.forEach(cardId => {
            showFlashEffect(cardId, '-10%', 'red')

            const traits = citizenTraits[cardId]
            if (traits) {
              const updatedTraits = { ...traits }
              const numericKeys: (keyof CitizenTraits)[] = ['strength', 'intelligence', 'cool', 'techSkill', 'attractiveness']
              numericKeys.forEach(key => {
                const val = updatedTraits[key]
                const numVal = typeof val === 'number' ? val : parseFloat(String(val)) || 0
                updatedTraits[key] = Math.floor(Math.max(0, numVal * 0.9)) as any
              })
              const reward = parseFloat(String(updatedTraits.rewardRate)) || 0
              updatedTraits.rewardRate = String(Math.floor(reward * 0.9))
              setCitizenTraits(prev => ({ ...prev, [cardId]: updatedTraits }))
            }
          })

          setOpponentDarkLordUsed(true)

          // Clear visual effects
          setTimeout(() => {
            setOpponentActiveSummon(null)
            setOpponentSummonTarget(null)
            resolve()
          }, 500)

        }, 1000)
      }, 200)
    })
  }

  const executeOpponentAngelic = (targetOpponentCard: number) => {
    return new Promise<void>((resolve) => {
      // 1. Highlight opponent's Angelic button
      setOpponentActiveSummon('angelic-overlord')

      // 2. After 200ms, show blue targeting line
      setTimeout(() => {
        setOpponentSummonTarget(targetOpponentCard)

        // 3. After 1 second, apply effects
        setTimeout(() => {
          const targetTraits = citizenTraits[targetOpponentCard]
          if (targetTraits) {
            // Flash "+50%" on opponent's targeted card
            showFlashEffect(targetOpponentCard, '+50%', 'green')

            // Increase target's all traits by 50%
            const updatedTraits = { ...targetTraits }
            const numericKeys: (keyof CitizenTraits)[] = ['strength', 'intelligence', 'cool', 'techSkill', 'attractiveness']
            numericKeys.forEach(key => {
              const val = updatedTraits[key]
              const numVal = typeof val === 'number' ? val : parseFloat(String(val)) || 0
              updatedTraits[key] = Math.floor(numVal * 1.5) as any
            })
            const reward = parseFloat(String(updatedTraits.rewardRate)) || 0
            updatedTraits.rewardRate = String(Math.floor(reward * 1.5))

            setCitizenTraits(prev => ({ ...prev, [targetOpponentCard]: updatedTraits }))
          }

          // Interlinked: Update cardTraitScores for target (+50%) and player's cards (+10%)
          setCardTraitScores(prev => {
            const newScores = { ...prev }

            // Target opponent card: +50% all trait scores
            const targetScores = newScores[targetOpponentCard] || getInitialTraitScores(targetOpponentCard)
            if (targetScores) {
              const boosted = { ...targetScores };
              (Object.keys(boosted) as Array<keyof CardTraitScores>).forEach(key => {
                boosted[key] = Math.floor(boosted[key] * 1.5)
              })
              newScores[targetOpponentCard] = boosted
            }

            // Player's cards: +10% all trait scores (penalty for opponent using angelic)
            playerDeck.forEach(cardId => {
              const scores = newScores[cardId] || getInitialTraitScores(cardId)
              if (scores) {
                const boosted = { ...scores };
                (Object.keys(boosted) as Array<keyof CardTraitScores>).forEach(key => {
                  boosted[key] = Math.floor(boosted[key] * 1.1)
                })
                newScores[cardId] = boosted
              }
            })

            return newScores
          })

          // Flash "+10%" on ALL player's cards (penalty for using angelic)
          playerDeck.forEach(cardId => {
            showFlashEffect(cardId, '+10%', 'green')

            const traits = citizenTraits[cardId]
            if (traits) {
              const updatedTraits = { ...traits }
              const numericKeys: (keyof CitizenTraits)[] = ['strength', 'intelligence', 'cool', 'techSkill', 'attractiveness']
              numericKeys.forEach(key => {
                const val = updatedTraits[key]
                const numVal = typeof val === 'number' ? val : parseFloat(String(val)) || 0
                updatedTraits[key] = Math.floor(numVal * 1.1) as any
              })
              const reward = parseFloat(String(updatedTraits.rewardRate)) || 0
              updatedTraits.rewardRate = String(Math.floor(reward * 1.1))
              setCitizenTraits(prev => ({ ...prev, [cardId]: updatedTraits }))
            }
          })

          setOpponentAngelicUsed(true)

          // Clear visual effects
          setTimeout(() => {
            setOpponentActiveSummon(null)
            setOpponentSummonTarget(null)
            resolve()
          }, 500)

        }, 1000)
      }, 200)
    })
  }

  const executeOpponentAngie = (resurrectedCardId: number) => {
    return new Promise<void>((resolve) => {
      // 1. Show notification modal
      setShowOpponentResurrectNotification({
        cardId: resurrectedCardId,
        visible: true
      })

      // 2. Calculate resurrected traits (80% of original)
      const graveyardCard = opponentGraveyard.find(c => c.id === resurrectedCardId)
      if (graveyardCard) {
        const resurrectedTraits = { ...graveyardCard.originalTraits }
        const numericKeys: (keyof CitizenTraits)[] = ['strength', 'intelligence', 'cool', 'techSkill', 'attractiveness']
        numericKeys.forEach(key => {
          const originalValue = resurrectedTraits[key]
          const numValue = typeof originalValue === 'number'
            ? originalValue
            : parseFloat(String(originalValue)) || 0
          resurrectedTraits[key] = Math.ceil(numValue * 0.8) as any
        })
        const reward = parseFloat(String(resurrectedTraits.rewardRate)) || 0
        resurrectedTraits.rewardRate = String(Math.ceil(reward * 0.8))

        // 3. Add card back to opponent deck
        setCitizenTraits((prev: any) => ({
          ...prev,
          [resurrectedCardId]: resurrectedTraits
        }))

        // Interlinked: Calculate trait scores at 80% of original for resurrected card
        const scores = getInitialTraitScores(resurrectedCardId, graveyardCard.originalTraits)
        if (scores) {
          (Object.keys(scores) as Array<keyof CardTraitScores>).forEach(key => {
            scores[key] = Math.ceil(scores[key] * 0.8)
          })
          setCardTraitScores(prev => ({ ...prev, [resurrectedCardId]: scores }))
        }

        setOpponentDeck((prev: any) => [...prev, resurrectedCardId])
        setOpponentGraveyard((prev: any) => prev.filter((c: any) => c.id !== resurrectedCardId))
        setOpponentAngieUsed(true)

        // 4. Show card appearing in opponent deck with green glow
        setResurrectCardHighlight(resurrectedCardId)
      }

      // 5. Auto-dismiss notification after 1 second
      setTimeout(() => {
        setShowOpponentResurrectNotification({ visible: false })

        // Clear green highlight after another 2 seconds
        setTimeout(() => {
          setResurrectCardHighlight(null)
          resolve()
        }, 2000)
      }, 1000)
    })
  }

  // Discard phase
  const [selectedForDiscard, setSelectedForDiscard] = useState<number | null>(null)
  const [showDiscardMessage, setShowDiscardMessage] = useState(false)

  // Battle phase
  const [selectedBattleCard, setSelectedBattleCard] = useState<number | null>(null)
  const [selectedTrait, setSelectedTrait] = useState<string | null>(null)
  const [selectedSecondTrait, setSelectedSecondTrait] = useState<string | null>(null) // Phase 4: Two-trait selection
  const [playerBattleCard, setPlayerBattleCard] = useState<number | null>(null)
  const [playerSelectedTrait, setPlayerSelectedTrait] = useState<string | null>(null)
  const [playerSelectedSecondTrait, setPlayerSelectedSecondTrait] = useState<string | null>(null) // Phase 4
  const [opponentBattleCard, setOpponentBattleCard] = useState<number | null>(null)
  const [opponentSelectedTrait, setOpponentSelectedTrait] = useState<string | null>(null)
  const [opponentSelectedSecondTrait, setOpponentSelectedSecondTrait] = useState<string | null>(null) // Phase 4
  const [opponentTargetCard, setOpponentTargetCard] = useState<number | null>(null) // New: Visual Feedback

  // Game state
  const [playerScore, setPlayerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [battleResult, setBattleResult] = useState<{ winner: 'player' | 'opponent' | 'tie', message: string, eliminated?: boolean } | null>(null)
  const [showBattleAnimation, setShowBattleAnimation] = useState(false)
  const [gameOver, setGameOver] = useState<'win' | 'lose' | null>(null)

  // Interlinked Battle Log
  const [battleLog, setBattleLog] = useState<{ trait: string, pVal: number | string, oVal: number | string, winner: 'player' | 'opponent' | 'tie' }[] | null>(null)
  const [showBattleReport, setShowBattleReport] = useState(false)
  const [reportTimer, setReportTimer] = useState(10)
  // FIX: Store card IDs for Battle Report display (persists after battle cleanup)
  const [reportPlayerCard, setReportPlayerCard] = useState<number | null>(null)
  const [reportOpponentCard, setReportOpponentCard] = useState<number | null>(null)
  // Phase 5: Turn counter and refresh
  const [turnCount, setTurnCount] = useState(0)
  const [isRefreshPhase, setIsRefreshPhase] = useState(false)
  const [refreshDrawnCard, setRefreshDrawnCard] = useState<number | null>(null)
  const [aiRefreshDrawnCard, setAiRefreshDrawnCard] = useState<number | null>(null)
  const [lastRefreshCard, setLastRefreshCard] = useState<number | null>(null) // Track last refresh card to protect from elimination
  const [playerRefreshDiscarded, setPlayerRefreshDiscarded] = useState(false)
  const [aiRefreshDiscarded, setAiRefreshDiscarded] = useState(false)

  // Rock Paper Scissors - First Turn Determination
  const [rpsPlayerChoice, setRpsPlayerChoice] = useState<'rock' | 'paper' | 'scissors' | null>(null)
  const [rpsAiChoice, setRpsAiChoice] = useState<'rock' | 'paper' | 'scissors' | null>(null)
  const [rpsResult, setRpsResult] = useState<'win' | 'lose' | 'tie' | null>(null)
  const [rpsRevealed, setRpsRevealed] = useState(false)
  const [rpsCountdown, setRpsCountdown] = useState<number | null>(null)
  const rpsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Phase 6: Summon abilities
  const [darkLordUsed, setDarkLordUsed] = useState(false)
  const [angelicOverlordUsed, setAngelicOverlordUsed] = useState(false)
  const [showDarkLordSelection, setShowDarkLordSelection] = useState(false)
  const [showAngelicSelection, setShowAngelicSelection] = useState(false)
  const [isTargeting, setIsTargeting] = useState(false)
  const [pendingTarget, setPendingTarget] = useState<number | null>(null)
  const [hoveredTarget, setHoveredTarget] = useState<number | null>(null)
  const [hoveredTargetRect, setHoveredTargetRect] = useState<{ x: number, y: number } | null>(null)
  const [hoveredDeckCard, setHoveredDeckCard] = useState<number | null>(null)
  const [activeSummon, setActiveSummon] = useState<'darklord' | 'angie' | 'angelic' | null>(null)
  const [debuffFlashTarget, setDebuffFlashTarget] = useState<number | null>(null)
  const [debuffFlashPlayer, setDebuffFlashPlayer] = useState<number>(0) // Timestamp to trigger player-wide flash
  const [buffFlashTarget, setBuffFlashTarget] = useState<number | null>(null)
  const [buffFlashOpponent, setBuffFlashOpponent] = useState<number>(0) // Timestamp to trigger opponent-wide flash
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null) // For sticky hover delay

  // Refs for targeting lines
  const opponentSummonDarkLordRef = useRef<HTMLDivElement>(null)
  const opponentSummonAngieRef = useRef<HTMLDivElement>(null)
  const opponentSummonAngelicRef = useRef<HTMLDivElement>(null)
  const playerDeckRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const opponentDeckRefs = useRef<Record<number, HTMLDivElement | null>>({})

  // INTERLINKED mode: Track trait scores for each card
  const [cardTraitScores, setCardTraitScores] = useState<Record<number, CardTraitScores>>({})

  // Phase 2: Elimination Notification
  const [eliminationNotice, setEliminationNotice] = useState<{ message: string, visible: boolean } | null>(null)

  // Phase 1: Angie Resurrection State
  const [playerGraveyard, setPlayerGraveyard] = useState<GraveyardCard[]>([])
  const [opponentGraveyard, setOpponentGraveyard] = useState<GraveyardCard[]>([])
  const [originalCitizenTraits, setOriginalCitizenTraits] = useState<Record<number, CitizenTraits>>({})
  const originalCitizenTraitsRef = useRef(originalCitizenTraits)
  originalCitizenTraitsRef.current = originalCitizenTraits
  const [showAngieGraveyard, setShowAngieGraveyard] = useState(false)
  const [selectedGraveyardCard, setSelectedGraveyardCard] = useState<number | null>(null)
  const [angieResurrectUsed, setAngieResurrectUsed] = useState(false)

  // AI Opponent Summon State
  const [opponentDarkLordUsed, setOpponentDarkLordUsed] = useState(false)
  const [opponentAngelicUsed, setOpponentAngelicUsed] = useState(false)
  const [opponentAngieUsed, setOpponentAngieUsed] = useState(false)
  const [opponentActiveSummon, setOpponentActiveSummon] = useState<'dark-lord' | 'angelic-overlord' | 'angie' | null>(null)
  const [opponentSummonTarget, setOpponentSummonTarget] = useState<number | null>(null)
  const [showOpponentResurrectNotification, setShowOpponentResurrectNotification] = useState<{ visible: boolean, cardId?: number }>({ visible: false })
  const [cardFlashEffects, setCardFlashEffects] = useState<Record<number, { text: string, color: 'red' | 'green', timestamp: number }>>({})
  const [resurrectCardHighlight, setResurrectCardHighlight] = useState<number | null>(null)

  // Handle Escape key to close Graveyard
  useEffect(() => {
    if (!showAngieGraveyard) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAngieGraveyard(false)
        setSelectedGraveyardCard(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showAngieGraveyard])

  // Keyboard navigation for Target Inspection Modal
  useEffect(() => {
    if (gameMode !== 'last-citizen-standing' || pendingTarget === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const currentIndex = opponentDeck.indexOf(pendingTarget)
        if (currentIndex === -1) return

        let nextIndex
        if (e.key === 'ArrowLeft') {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : opponentDeck.length - 1
        } else {
          nextIndex = currentIndex < opponentDeck.length - 1 ? currentIndex + 1 : 0
        }
        setPendingTarget(opponentDeck[nextIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameMode, pendingTarget, opponentDeck])

  // Helper to get trait value
  const getTraitValue = (traitString: string, traits: CitizenTraits): number | string => {
    if (!traits) return 0
    const category = traitString.split(': ')[0]
    switch (category) {
      case 'Class': return traits.class
      case 'Race': return traits.race
      case 'Eyes': return traits.eyes
      case 'Location': return traits.location
      case 'Item': return traits.additionalItem
      case 'Weapon': return traits.weapon
      case 'Vehicle': return traits.vehicle
      case 'Apparel': return traits.apparel
      case 'Helm': return traits.helm
      case 'Reward': return traits.rewardRate
      case 'Ability': return traits.ability
      case 'Strength': return traits.strength
      case 'Intelligence': return traits.intelligence
      case 'Cool': return traits.cool
      case 'Tech Skill': return traits.techSkill
      case 'Attractiveness': return traits.attractiveness
      default: return 0
    }
  }

  const startGame = () => {
    setShowGameModes(true)
  }

  // Game Mode Configuration - Easy toggle for enabling/disabling modes
  const GAME_MODE_CONFIG = {
    'omnipresent': {
      enabled: false,
      displayName: 'Omnipresent',
      description: 'Full battlefield awareness. All traits visible.',
      styleClass: 'btn-mode-purple text-purple-400 hover:text-purple-300'
    },
    'chaotic': {
      enabled: false,
      displayName: 'Chaotic',
      description: 'Limited intel phase. Strength is the only metric.',
      styleClass: 'btn-mode-blue text-blue-400 hover:text-blue-300'
    },
    'threat-intelligence': {
      enabled: false,
      displayName: 'Threat Intel',
      description: 'Counter-ops. Blind defense mechanism active.',
      styleClass: 'btn-mode-red text-red-500 hover:text-red-400'
    },
    'last-citizen-standing': {
      enabled: false,
      displayName: 'Last Citizen',
      description: 'Total attrition warfare. Eliminate all assets.',
      styleClass: 'btn-mode-orange text-orange-400 hover:text-orange-300'
    },
    'interlinked': {
      enabled: true,
      displayName: 'INTERLINKED',
      description: 'Trait-based warfare. Score reduction combat.',
      styleClass: 'btn-mode-cyan text-cyan-400 hover:text-cyan-300'
    }
  } as const;

  type GameModeKey = keyof typeof GAME_MODE_CONFIG;

  const startGameWithMode = (mode: GameModeKey) => {
    // Safety check - prevent starting disabled modes
    if (!GAME_MODE_CONFIG[mode].enabled) {
      console.warn(`[SYSTEM] Attempted to start disabled mode: ${mode}`);
      return;
    }

    setGameMode(mode as GameMode)
    setShowGameModes(false)
    setIsLoading(true)
    setGameStarted(true)
    setGamePhase('discard')
    setDiscardedCards([])
    setTimer(30)
    discardMessageShown.current = false

    // Phase 5 & 6: Reset Last Citizen Standing states
    setTurnCount(0)
    setIsRefreshPhase(false)
    setRefreshDrawnCard(null)
    setPlayerRefreshDiscarded(false)
    setAiRefreshDiscarded(false)
    setDarkLordUsed(false)
    setAngelicOverlordUsed(false)
    setShowDarkLordSelection(false)
    setShowAngelicSelection(false)
    setIsTargeting(false)
    setPendingTarget(null)
    setSelectedSecondTrait(null)
    setBuffFlashTarget(null)
    setBuffFlashOpponent(0)
    setDebuffFlashTarget(null)
    setDebuffFlashPlayer(0)

    // Reset Angie Resurrection State
    setPlayerGraveyard([])
    setOpponentGraveyard([])
    setOriginalCitizenTraits({})
    setShowAngieGraveyard(false)
    setSelectedGraveyardCard(null)
    setAngieResurrectUsed(false)

    // Reset Opponent Summon State
    setOpponentDarkLordUsed(false)
    setOpponentAngelicUsed(false)
    setOpponentAngieUsed(false)
    setOpponentActiveSummon(null)
    setOpponentSummonTarget(null)
    setShowOpponentResurrectNotification({ visible: false })
    setCardFlashEffects({})
    setResurrectCardHighlight(null)

    // FIX: Reset Battle Report stored card IDs
    setReportPlayerCard(null)
    setReportOpponentCard(null)

    const randomIds = new Set<number>()
    while (randomIds.size < 48) {
      randomIds.add(Math.floor(Math.random() * 3968) + 1)
    }

    const cards: CitizenCard[] = Array.from(randomIds).map(id => ({
      id,
      loaded: false
    }))

    setCitizens(cards)
  }

  const handleImageLoad = (id: number) => {
    setCitizens(prev => prev.map(card => card.id === id ? { ...card, loaded: true } : card))
    console.log(`Loaded card ${id}, total valid: ${validCitizens.length + 1}`)
  }

  const handleImageError = (id: number) => {
    setCitizens(prev => prev.filter(card => card.id !== id))
    console.log(`Failed to load card ${id}`)
  }

  const validCitizens = citizens.filter(c => c.loaded)

  const handleDiscard = () => {
    if (!selectedForDiscard) return;

    if (isRefreshPhase) {
      // Refresh Phase specific discard logic
      console.log(`[DEBUG] handleDiscard (Refresh) - Removing selected card: ${selectedForDiscard}`)

      // Update player deck: Double-verify Draw immersion
      setPlayerDeck((prev: number[]) => {
        const normalizedSelected = Number(selectedForDiscard)
        const currentRefreshed = Number(refreshDrawnCard)

        // 1. Remove selected
        let list = prev.filter(id => Number(id) !== normalizedSelected).map(id => Number(id))

        // 2. ABSOLUTE REDUNDANCY: Force the Refresh card into index 0 if missing
        if (currentRefreshed && !list.includes(currentRefreshed)) {
          console.log(`[DEBUG] Redundant Inject: Adding card ${currentRefreshed} in handleDiscard (was missing)`);
          list = [currentRefreshed, ...list];
        } else if (currentRefreshed) {
          // Move to front if already there for transparency
          const filtered = list.filter(id => id !== currentRefreshed);
          list = [currentRefreshed, ...filtered];
        }

        console.log(`[DEBUG] Player deck updated (removal + draw check). new size: ${list.length}`)
        return list
      })

      setPlayerRefreshDiscarded(true)

      // AI Failsafe: Ensure phase can advance
      if (!aiRefreshDiscarded) {
        console.log('[DEBUG] Forcing AI discard flag in handleDiscard failsafe')
        setAiRefreshDiscarded(true)
      }

      setSelectedForDiscard(null)
      return
    }

    // Standard Discard Phase logic (Turn 0)
    if (!discardedCards.includes(selectedForDiscard)) {
      const newDiscarded = [...discardedCards, selectedForDiscard]
      setDiscardedCards(newDiscarded)

      const availableCards = validCitizens.slice(0, 12).filter((c: CitizenCard) => !newDiscarded.includes(c.id))
      const currentIndex = availableCards.findIndex(c => c.id === selectedForDiscard)
      // Go to next card, or wrap to first if at end
      if (newDiscarded.length < 3) {
        const nextIndex = currentIndex < availableCards.length - 1 ? currentIndex + 1 : 0
        setSelectedForDiscard(availableCards[nextIndex].id)
      }

      if (newDiscarded.length === 3) {
        // Player gets first 12 cards minus the 3 discarded = 9 cards
        const allValid = validCitizens.slice(0, 12)
        const remaining = allValid.filter(c => !newDiscarded.includes(c.id)).map(c => c.id)
        setPlayerDeck(remaining)

        // AI opponent gets next 12 cards and intelligently discards 3 weakest
        const aiCards = validCitizens.slice(12, 24)

        // Fetch traits for all AI cards and calculate their total power
        const aiCardsWithPower = aiCards.map(card => {
          const traits = citizenTraits[card.id]
          if (!traits) {
            // If traits not loaded, assign random power
            return { id: card.id, power: Math.random() * 100 }
          }
          // Calculate total power based on numerical stats
          const power = traits.strength + traits.intelligence + traits.cool +
            traits.techSkill + traits.attractiveness
          return { id: card.id, power }
        })

        // Sort by power and discard the 3 weakest
        aiCardsWithPower.sort((a, b) => b.power - a.power)
        const aiDeck = aiCardsWithPower.slice(0, 9).map(c => c.id)

        setOpponentDeck(aiDeck)
        setGamePhase('rps')
        setSelectedForDiscard(null)
      }
    }
  }

  // === Rock Paper Scissors Logic ===
  const RPS_CHOICES = ['rock', 'paper', 'scissors'] as const
  type RPSChoice = typeof RPS_CHOICES[number]

  const RPS_IMAGES: Record<RPSChoice, string> = {
    rock: 'https://raw.githubusercontent.com/badfuture-926/neo-tokyo-card-clash/main/rock.jpg',
    paper: 'https://raw.githubusercontent.com/badfuture-926/neo-tokyo-card-clash/main/paper.jpg',
    scissors: 'https://raw.githubusercontent.com/badfuture-926/neo-tokyo-card-clash/main/scissors.jpg',
  }
  const RpsIcon = ({ choice, size = 'w-24 h-24' }: { choice: RPSChoice, size?: string }) => (
    <img
      src={RPS_IMAGES[choice]}
      alt={choice}
      className={`${size} rounded-xl object-contain pointer-events-none select-none`}
      draggable={false}
    />
  )

  const determineRpsWinner = (player: RPSChoice, ai: RPSChoice): 'win' | 'lose' | 'tie' => {
    if (player === ai) return 'tie'
    if (
      (player === 'rock' && ai === 'scissors') ||
      (player === 'paper' && ai === 'rock') ||
      (player === 'scissors' && ai === 'paper')
    ) return 'win'
    return 'lose'
  }

  const handleRpsChoice = (choice: RPSChoice) => {
    if (rpsRevealed || rpsPlayerChoice) return
    setRpsPlayerChoice(choice)
    const aiChoice = RPS_CHOICES[Math.floor(Math.random() * 3)]
    setRpsAiChoice(aiChoice)
    setRpsCountdown(3)
  }

  // RPS countdown timer
  useEffect(() => {
    if (rpsCountdown === null || rpsCountdown <= 0) return
    const t = setTimeout(() => {
      setRpsCountdown(prev => prev !== null ? prev - 1 : null)
    }, 600)
    return () => clearTimeout(t)
  }, [rpsCountdown])

  // RPS reveal and result — fires once when countdown hits 0
  useEffect(() => {
    if (rpsCountdown !== 0 || !rpsPlayerChoice || !rpsAiChoice || rpsRevealed) return

    setRpsRevealed(true)
    const result = determineRpsWinner(rpsPlayerChoice, rpsAiChoice)
    setRpsResult(result)

    // Use ref so React cleanup can't cancel this timeout
    if (rpsTimeoutRef.current) clearTimeout(rpsTimeoutRef.current)

    if (result === 'tie') {
      rpsTimeoutRef.current = setTimeout(() => {
        setRpsPlayerChoice(null)
        setRpsAiChoice(null)
        setRpsResult(null)
        setRpsRevealed(false)
        setRpsCountdown(null)
      }, 1800)
    } else {
      rpsTimeoutRef.current = setTimeout(() => {
        setIsPlayerTurn(result === 'win')
        setGamePhase('battle')
        setTimer(30)
        setRpsPlayerChoice(null)
        setRpsAiChoice(null)
        setRpsResult(null)
        setRpsRevealed(false)
        setRpsCountdown(null)
      }, 2500)
    }
  }, [rpsCountdown, rpsPlayerChoice, rpsAiChoice, rpsRevealed])

  const applyDarkLordEffect = (targetId: number) => {
    if (darkLordUsed || activeSummon !== 'darklord') return;

    console.log(`[SUMMON] Dark Lord attacking Citizen #${targetId}`);

    // Recalculate traits for Target: -50%
    setCardTraitScores(prev => {
      const newScores = { ...prev };

      const currentTargetScores = newScores[targetId] || getInitialTraitScores(targetId);
      if (currentTargetScores) {
        const reducedTargetScores = { ...currentTargetScores };
        (Object.keys(reducedTargetScores) as Array<keyof CardTraitScores>).forEach(key => {
          const val = reducedTargetScores[key];
          if (typeof val === 'number') {
            (reducedTargetScores as any)[key] = Math.floor(val * 0.5);
          }
        });
        newScores[targetId] = reducedTargetScores;
      }

      // Recalculate traits for ALL Player Cards: -10%
      playerDeck.forEach(pid => {
        const pId = Number(pid);
        const currentPlayerScores = newScores[pId] || getInitialTraitScores(pId);
        if (currentPlayerScores) {
          const reducedPlayerScores = { ...currentPlayerScores };
          (Object.keys(reducedPlayerScores) as Array<keyof CardTraitScores>).forEach(key => {
            const val = reducedPlayerScores[key];
            if (typeof val === 'number') {
              (reducedPlayerScores as any)[key] = Math.floor(val * 0.9);
            }
          });
          newScores[pId] = reducedPlayerScores;
        }
      });

      return newScores;
    });

    // Visuals
    setDebuffFlashTarget(targetId);
    setDebuffFlashPlayer(Date.now());
    setDarkLordUsed(true);
    setActiveSummon(null);
    setIsTargeting(false);

    // Clear target flash after some time
    setTimeout(() => {
      setDebuffFlashTarget(null);
    }, 2500);
  };

  const applyAngelicEffect = (targetId: number) => {
    if (angelicOverlordUsed || activeSummon !== 'angelic') return;

    console.log(`[SUMMON] Angelic Overlord boosting Player #${targetId}`);

    setCardTraitScores(prev => {
      const newScores = { ...prev };

      // Recalculate traits for Target (Player): +50%
      const currentTargetScores = newScores[targetId] || getInitialTraitScores(targetId);
      if (currentTargetScores) {
        const boostedTargetScores = { ...currentTargetScores };
        (Object.keys(boostedTargetScores) as Array<keyof CardTraitScores>).forEach(key => {
          const val = boostedTargetScores[key];
          if (typeof val === 'number') {
            (boostedTargetScores as any)[key] = Math.floor(val * 1.5);
          }
        });
        newScores[targetId] = boostedTargetScores;
      }

      // Recalculate traits for ALL Opponent Cards: +10%
      opponentDeck.forEach(oid => {
        const oId = Number(oid);
        const currentOpponentScores = newScores[oId] || getInitialTraitScores(oId);
        if (currentOpponentScores) {
          const boostedOpponentScores = { ...currentOpponentScores };
          (Object.keys(boostedOpponentScores) as Array<keyof CardTraitScores>).forEach(key => {
            const val = boostedOpponentScores[key];
            if (typeof val === 'number') {
              (boostedOpponentScores as any)[key] = Math.floor(val * 1.1);
            }
          });
          newScores[oId] = boostedOpponentScores;
        }
      });

      return newScores;
    });

    // Also update raw CitizenTraits for Standard Mode / Chaotic Mode compatibility
    setCitizenTraits(prev => {
      const newTraits = { ...prev };

      // Target Buff: +50%
      if (newTraits[targetId]) {
        const t = { ...newTraits[targetId] };
        t.strength = Math.floor((t.strength || 0) * 1.5);
        t.intelligence = Math.floor((t.intelligence || 0) * 1.5);
        t.cool = Math.floor((t.cool || 0) * 1.5);
        t.techSkill = Math.floor((t.techSkill || 0) * 1.5);
        t.attractiveness = Math.floor((t.attractiveness || 0) * 1.5);
        newTraits[targetId] = t;
      }

      // Opponent Deck Buff: +10%
      opponentDeck.forEach(oid => {
        const oId = Number(oid);
        if (newTraits[oId]) {
          const t = { ...newTraits[oId] };
          t.strength = Math.floor((t.strength || 0) * 1.1);
          t.intelligence = Math.floor((t.intelligence || 0) * 1.1);
          t.cool = Math.floor((t.cool || 0) * 1.1);
          t.techSkill = Math.floor((t.techSkill || 0) * 1.1);
          t.attractiveness = Math.floor((t.attractiveness || 0) * 1.1);
          newTraits[oId] = t;
        }
      });

      return newTraits;
    });

    // Visuals
    setBuffFlashTarget(targetId);
    setBuffFlashOpponent(Date.now());
    setAngelicOverlordUsed(true);
    setActiveSummon(null);
    setIsTargeting(false);

    // Clear target flash after some time
    setTimeout(() => {
      setBuffFlashTarget(null);
    }, 2500);
  };

  const fetchTraitsForCitizen = async (citizenId: number): Promise<CitizenTraits | null> => {
    try {
      const alchemyApiKey = '0uBM1JotEbL5ERgVwcDEa'
      const contractAddress = '0xb9951b43802dcf3ef5b14567cb17adf367ed1c0f'

      const url = `https://eth-mainnet.g.alchemy.com/nft/v3/${alchemyApiKey}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${citizenId}&refreshCache=false`

      const response = await fetch(url)

      if (!response.ok) {
        return generateRandomTraits()
      }

      const data = await response.json()
      const attributes = data.raw?.metadata?.attributes || data.metadata?.attributes || []

      if (!Array.isArray(attributes) || attributes.length === 0) {
        return generateRandomTraits()
      }

      const traits: Partial<CitizenTraits> = {}

      attributes.forEach((attr: { trait_type: string, value: string | number }) => {
        const traitType = attr.trait_type?.toLowerCase()
        const value = attr.value

        if (!traitType) return

        switch (traitType) {
          case 'class': traits.class = String(value); break
          case 'race': traits.race = String(value); break
          case 'strength': traits.strength = Number(value); break
          case 'intelligence': traits.intelligence = Number(value); break
          case 'attractiveness': traits.attractiveness = Number(value); break
          case 'tech skill': traits.techSkill = Number(value); break
          case 'cool': traits.cool = Number(value); break
          case 'eyes': traits.eyes = String(value); break
          case 'ability': traits.ability = String(value); break
          case 'location': traits.location = String(value); break
          case 'additional item': traits.additionalItem = String(value); break
          case 'weapon': traits.weapon = String(value); break
          case 'vehicle': traits.vehicle = String(value); break
          case 'apparel': traits.apparel = String(value); break
          case 'helm': traits.helm = String(value); break
          case 'reward rate': traits.rewardRate = String(value); break
        }
      })

      if (traits.class && traits.race) {
        return traits as CitizenTraits
      }

      return generateRandomTraits()
    } catch (error) {
      return generateRandomTraits()
    }
  }

  const generateRandomTraits = (): CitizenTraits => {
    const classes = ['Nerd', 'Ronin', 'Cyber Monk', 'Hacker', 'Street Samurai']
    const races = ['Human', 'Cyborg', 'Android', 'Mutant']
    const eyes = ['Normal', 'Laser Eyes', 'Tired', 'Angry', 'Happy']
    const abilities = ['None', 'Revive', 'Hard Gut', 'Cloak', 'Hack']
    const locations = ['Mid Town', 'Neo Tokyo Streets', 'Underground', 'High Rise']
    const weapons = ['None', 'Katana', 'Cyber Katana', 'Laser Sword', 'Tech Staff']
    const vehicles = ['None', 'Hover Bike', 'Sports Car', 'Motorcycle']
    const apparels = ['Work Clothes', 'Leather Jacket', 'Suit', 'Hoodie']
    const helms = ['None', 'Gas Mask', 'Samurai Mask', 'Visor', 'Helmet']

    return {
      class: classes[Math.floor(Math.random() * classes.length)],
      race: races[Math.floor(Math.random() * races.length)],
      strength: Math.floor(Math.random() * 60) + 40,
      intelligence: Math.floor(Math.random() * 60) + 40,
      attractiveness: Math.floor(Math.random() * 60) + 40,
      techSkill: Math.floor(Math.random() * 60) + 40,
      cool: Math.floor(Math.random() * 60) + 40,
      eyes: eyes[Math.floor(Math.random() * eyes.length)],
      ability: abilities[Math.floor(Math.random() * abilities.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      additionalItem: 'Cyber Deck',
      weapon: weapons[Math.floor(Math.random() * weapons.length)],
      vehicle: vehicles[Math.floor(Math.random() * vehicles.length)],
      apparel: apparels[Math.floor(Math.random() * apparels.length)],
      helm: helms[Math.floor(Math.random() * helms.length)],
      rewardRate: 'High'
    }
  }

  const getTraitsForCitizen = async (citizenId: number) => {
    if (!citizenTraits[citizenId]) {
      const traits = await fetchTraitsForCitizen(citizenId)
      if (traits) {
        setCitizenTraits(prev => ({ ...prev, [citizenId]: traits }))

        // INTERLINKED mode: Initialize trait scores when traits are loaded
        if (gameMode === 'interlinked') {
          const scores = getInitialTraitScores(citizenId)
          if (scores) {
            setCardTraitScores(prev => ({ ...prev, [citizenId]: scores }))
          }
        }

        // Save pristine copy of original traits
        setOriginalCitizenTraits(prev => ({ ...prev, [citizenId]: traits }))

        return traits
      }
    }
    return citizenTraits[citizenId]
  }

  // INTERLINKED mode: Calculate initial trait scores from traitScores.json
  const getInitialTraitScores = (cardId: number, subtitleTraits?: CitizenTraits): CardTraitScores | null => {
    const traits = subtitleTraits || originalCitizenTraits[cardId] || citizenTraits[cardId]
    if (!traits) return null

    const getScore = (category: string, value: string | number) => {
      const categoryData = (traitScores as any)[category]
      if (!categoryData) return 0

      const valStr = String(value)
      // Try exact match
      if (categoryData[valStr] !== undefined) return categoryData[valStr]

      // Try case-insensitive match
      const lowerVal = valStr.toLowerCase()
      const foundKey = Object.keys(categoryData).find(k => k.toLowerCase() === lowerVal)
      if (foundKey) return categoryData[foundKey]

      // Default fallback
      return 10
    }

    const scores = {
      race: getScore('Race', traits.race),
      class: getScore('Class', traits.class),
      eyes: getScore('Eyes', traits.eyes),
      ability: getScore('Ability', traits.ability),
      additionalItem: getScore('Additional Item', traits.additionalItem),
      helm: getScore('Helm', traits.helm),
      location: getScore('Location', traits.location),
      vehicle: getScore('Vehicle', traits.vehicle),
      apparel: getScore('Apparel', traits.apparel),
      rewardRate: getScore('Reward Rate', traits.rewardRate),
      weapon: getScore('Weapon', traits.weapon),
      strength: getScore('Strength', traits.strength)
    }
    // console.log(`[DEBUG] Trait Scores for Card ${cardId}:`, scores)
    return scores
  }

  // INTERLINKED mode: Resolve battle with trait score reduction
  const resolveInterlinkBattle = (playerCardId: number, opponentCardId: number) => {
    let playerScores = cardTraitScores[playerCardId]
    let opponentScores = cardTraitScores[opponentCardId]

    // Fallback: If scores are missing from state (e.g. fresh load), calculate them now
    if (!playerScores) {
      const initInfo = getInitialTraitScores(playerCardId)
      if (initInfo) playerScores = initInfo
    }
    if (!opponentScores) {
      const initInfo = getInitialTraitScores(opponentCardId)
      if (initInfo) opponentScores = initInfo
    }

    if (!playerScores || !opponentScores) {
      console.error('Missing trait scores for battle')
      return null
    }

    const newPlayerScores = { ...playerScores }
    const newOpponentScores = { ...opponentScores }

    // Fight all 12 traits simultaneously
    const traits: (keyof CardTraitScores)[] = [
      'race', 'class', 'eyes', 'ability', 'additionalItem', 'helm',
      'location', 'vehicle', 'apparel', 'rewardRate', 'weapon', 'strength'
    ]

    let playerWins = 0
    let opponentWins = 0
    let ties = 0

    traits.forEach(trait => {
      const playerScore = playerScores[trait]
      const opponentScore = opponentScores[trait]
      const diff = Math.abs(playerScore - opponentScore)

      if (playerScore > opponentScore) {
        playerWins++
        newPlayerScores[trait] = diff
        newOpponentScores[trait] = 0
      } else if (opponentScore > playerScore) {
        opponentWins++
        newOpponentScores[trait] = diff
        newPlayerScores[trait] = 0
      } else {
        // Tie - no change to scores
        ties++
      }
    })

    // Update state
    setCardTraitScores(prev => ({
      ...prev,
      [playerCardId]: newPlayerScores,
      [opponentCardId]: newOpponentScores
    }))

    // Check for elimination (6+ traits at 0) - ONLY criteria per CLAUDE.md
    const playerZeros = Object.values(newPlayerScores).filter(v => v === 0).length
    const opponentZeros = Object.values(newOpponentScores).filter(v => v === 0).length

    // Generate detailed battle log
    // Generate detailed battle log
    const initPlayerScores = getInitialTraitScores(playerCardId) || playerScores;
    const initOpponentScores = getInitialTraitScores(opponentCardId) || opponentScores;

    const details = traits.map(trait => {
      const pScore = playerScores[trait];
      const oScore = opponentScores[trait];
      const pBase = initPlayerScores[trait];
      const oBase = initOpponentScores[trait];

      // Get display values (original strings/numbers)
      let pDisplay: string | number = pScore;
      let oDisplay: string | number = oScore;

      if (citizenTraits[playerCardId]) {
        // Handle case mappings if needed, or just raw value
        const raw = citizenTraits[playerCardId][trait as keyof CitizenTraits];
        if (raw !== undefined) {
          // If the score is reduced, show the current score for text traits, or Base for numeric
          if (pScore < pBase) {
            if (typeof raw === 'number') {
              pDisplay = `${raw} [${pBase}]`;
            } else {
              pDisplay = `${raw} [${pScore}]`;
            }
          } else {
            pDisplay = raw;
          }
        }
      }
      if (citizenTraits[opponentCardId]) {
        const raw = citizenTraits[opponentCardId][trait as keyof CitizenTraits];
        if (raw !== undefined) {
          // Same logic for opponent
          if (oScore < oBase) {
            if (typeof raw === 'number') {
              oDisplay = `${raw} [${oBase}]`;
            } else {
              oDisplay = `${raw} [${oScore}]`;
            }
          } else {
            oDisplay = raw;
          }
        }
      }

      let winner: 'player' | 'opponent' | 'tie' = 'tie';
      if (pScore > oScore) winner = 'player';
      else if (oScore > pScore) winner = 'opponent';

      // Format trait label
      const traitLabels: Record<string, string> = {
        race: 'Race',
        class: 'Class',
        eyes: 'Eyes',
        ability: 'Ability',
        additionalItem: 'Item',
        helm: 'Helm',
        location: 'Location',
        vehicle: 'Vehicle',
        apparel: 'Apparel',
        rewardRate: 'Reward',
        weapon: 'Weapon',
        strength: 'Strength'
      };

      return { trait: traitLabels[trait] || trait, pVal: pDisplay, oVal: oDisplay, winner };
    });
    setBattleLog(details);

    return {
      playerEliminated: playerZeros >= 6,
      opponentEliminated: opponentZeros >= 6,
      playerScores: newPlayerScores,
      opponentScores: newOpponentScores,
      playerZeros,
      opponentZeros,
      playerWins,
      opponentWins,
      ties
    }
  }

  // AI opponent decision-making
  const aiChooseCard = (attackingTrait: string, attackingValue: string | number, isDefending: boolean) => {
    try {
      const availableCards = opponentDeck.filter(id => id !== opponentBattleCard)

      // Safety check for empty deck
      if (availableCards.length === 0) {
        console.warn('AI has no available cards to choose from!');
        // If deck has cards but filtered out (shouldn't happen given logic), fallback to first in deck
        return opponentDeck.length > 0 ? opponentDeck[0] : 0;
      }

      // Analyze cards and choose strategy
      const cardAnalysis = availableCards.map(cardId => {
        const traits = citizenTraits[cardId]
        if (!traits) return { cardId, score: 0, traitValue: 0 as string | number, cardPower: 0 }

        // Extract trait category and value from attacking trait string
        const traitParts = attackingTrait.split(': ')
        const traitCategory = traitParts[0]

        let traitValue: string | number = 0
        switch (traitCategory) {
          case 'Class': traitValue = traits.class; break
          case 'Race': traitValue = traits.race; break
          case 'Eyes': traitValue = traits.eyes; break
          case 'Location': traitValue = traits.location; break
          case 'Item': traitValue = traits.additionalItem; break
          case 'Weapon': traitValue = traits.weapon; break
          case 'Vehicle': traitValue = traits.vehicle; break
          case 'Apparel': traitValue = traits.apparel; break
          case 'Helm': traitValue = traits.helm; break
          case 'Reward': traitValue = traits.rewardRate; break
          case 'Ability': traitValue = traits.ability; break
          case 'Strength': traitValue = traits.strength; break
          case 'Intelligence': traitValue = traits.intelligence; break
          case 'Cool': traitValue = traits.cool; break
          case 'Tech Skill': traitValue = traits.techSkill; break
          case 'Attractiveness': traitValue = traits.attractiveness; break
          default: traitValue = 0 // Default for 'Average' or unknown traits
        }

        // Calculate overall card strength
        const cardPower = traits.strength + traits.intelligence + traits.cool +
          traits.techSkill + traits.attractiveness

        return { cardId, traitValue, cardPower }
      })

      if (isDefending) {
        // AI is defending - try to use weakest card that might win, or sacrifice weakest
        const canWin = cardAnalysis.filter(c => {
          if (typeof c.traitValue === 'number' && typeof attackingValue === 'number') {
            return c.traitValue > attackingValue
          }
          return false // For non-numeric, simplified comparison
        })

        if (canWin.length > 0) {
          // Use weakest card that can still win
          canWin.sort((a, b) => a.cardPower - b.cardPower)
          return canWin[0].cardId
        } else {
          // Sacrifice weakest card
          cardAnalysis.sort((a, b) => a.cardPower - b.cardPower)
          return cardAnalysis[0] ? cardAnalysis[0].cardId : availableCards[0];
        }
      } else {
        // AI is attacking - choose strongest card
        cardAnalysis.sort((a, b) => b.cardPower - a.cardPower)
        const strongestCard = cardAnalysis[0]
        return strongestCard ? strongestCard.cardId : availableCards[0];
      }
    } catch (e) {
      console.error('CRITICAL ERROR in aiChooseCard:', e);
      // Failsafe: return random available card or first card
      const available = opponentDeck.filter(id => id !== opponentBattleCard)
      if (available.length > 0) return available[Math.floor(Math.random() * available.length)];
      return opponentDeck[0] || 0;
    }
  }
  // FIX: Ensure traits are loaded before battle starts
  const ensureTraitsLoaded = async (cardId: number): Promise<boolean> => {
    if (citizenTraits[cardId]) return true

    console.log(`[BATTLE DEBUG] Loading missing traits for card ${cardId}`)
    const traits = await getTraitsForCitizen(cardId)
    return !!traits
  }
  // Execute battle when both cards are placed
  const battleInProgressRef = useRef(false)
  const [battleRetryTrigger, setBattleRetryTrigger] = useState(0)
  useEffect(() => {
    // Auto-recovery: if both cards set but ref is stuck, schedule a force-reset
    if (playerBattleCard && opponentBattleCard && !battleResult && battleInProgressRef.current) {
      console.warn('[BATTLE] battleInProgressRef stuck true — scheduling auto-reset')
      const recovery = setTimeout(() => {
        battleInProgressRef.current = false
        setBattleRetryTrigger(prev => prev + 1)
      }, 2000)
      return () => clearTimeout(recovery)
    }

    const readyForBattle = playerBattleCard && opponentBattleCard && !battleResult && !battleInProgressRef.current
    if (playerBattleCard && opponentBattleCard) {
      console.log('[BATTLE DEBUG] Effect Triggered:', { playerBattleCard, opponentBattleCard, battleResult, readyForBattle, gameMode })
    }
    if (readyForBattle) {
      battleInProgressRef.current = true
      setShowBattleAnimation(true)

      setTimeout(async () => {
        let playerTraits = citizenTraitsRef.current[playerBattleCard!]
        let opponentTraits = citizenTraitsRef.current[opponentBattleCard!]

        // FIX: If traits missing, try to load them before giving up
        if (!playerTraits) {
          const loaded = await fetchTraitsForCitizen(playerBattleCard!)
          if (loaded) {
            setCitizenTraits(prev => ({ ...prev, [playerBattleCard!]: loaded }))
            playerTraits = loaded
          }
        }
        if (!opponentTraits) {
          const loaded = await fetchTraitsForCitizen(opponentBattleCard!)
          if (loaded) {
            setCitizenTraits(prev => ({ ...prev, [opponentBattleCard!]: loaded }))
            opponentTraits = loaded
          }
        }

        if (!playerTraits || !opponentTraits) {
          console.error('[BATTLE] Failed to load traits, resetting battle state')
          battleInProgressRef.current = false
          setShowBattleAnimation(false)
          setPlayerBattleCard(null)
          setOpponentBattleCard(null)
          setIsPlayerTurn(true)
          setTimer(30)
          return
        }

        let playerDead = false
        let opponentDead = false

        let winner: 'player' | 'opponent' | 'tie' = 'tie'
        let message = ''

        if (gameMode === 'last-citizen-standing') {
          // LCS Combat Logic: Direct Subtraction Defender, Spent Superiority Attacker
          const traitsKeys = ['strength', 'intelligence', 'cool', 'techSkill', 'attractiveness', 'rewardRate'] as (keyof CitizenTraits)[]

          const newPlayerTraits = { ...playerTraits }
          const newOpponentTraits = { ...opponentTraits }

          const playerFinal: Record<string, number> = {}
          const opponentFinal: Record<string, number> = {}

          traitsKeys.forEach(t => {
            const pVal = typeof playerTraits[t] === 'number' ? (playerTraits[t] as number) : parseFloat(String(playerTraits[t])) || 0
            const oVal = typeof opponentTraits[t] === 'number' ? (opponentTraits[t] as number) : parseFloat(String(opponentTraits[t])) || 0

            // Symmetric Subtraction: Both take damage equal to opponent's trait
            playerFinal[String(t)] = Math.max(0, pVal - oVal)
            opponentFinal[String(t)] = Math.max(0, oVal - pVal)
          })

          // Calculate zero counts for elimination
          const pZeroes = traitsKeys.filter(t => playerFinal[String(t)] === 0).length
          const oZeroes = traitsKeys.filter(t => opponentFinal[String(t)] === 0).length

          playerDead = pZeroes >= 3
          opponentDead = oZeroes >= 3

          // Determine Winner and Message
          if (playerDead && opponentDead) {
            winner = 'tie'
            message = 'MUTUAL ELIMINATION! Both cards destroyed.'
          } else if (isPlayerTurn ? opponentDead : playerDead) {
            winner = isPlayerTurn ? 'player' : 'opponent'
            message = 'PERMANENT ELIMINATION! Card destroyed.'
          } else if (isPlayerTurn ? playerDead : opponentDead) {
            winner = isPlayerTurn ? 'opponent' : 'player'
            message = 'TOTAL ATTRITION! Card exhausted.'
          } else {
            winner = 'tie'
            message = 'CLASH! Both cards survived but were weakened.'
          }

          // Sync back to state objects
          traitsKeys.forEach(t => {
            const p = playerFinal[String(t)]
            const o = opponentFinal[String(t)]
            if (t === 'rewardRate') {
              newPlayerTraits.rewardRate = String(p)
              newOpponentTraits.rewardRate = String(o)
            } else {
              (newPlayerTraits[t] as number) = p;
              (newOpponentTraits[t] as number) = o;
            }
          })

          setCitizenTraits((prev: Record<number, CitizenTraits>) => ({
            ...prev,
            [playerBattleCard!]: newPlayerTraits,
            [opponentBattleCard!]: newOpponentTraits
          }))
        } else if (gameMode === 'interlinked') {
          // INTERLINKED Combat Logic: 12-trait score reduction
          // Ensure we have valid IDs
          if (!playerBattleCard || !opponentBattleCard) {
            console.error('Missing battle cards for INTERLINKED:', { playerBattleCard, opponentBattleCard })
            battleInProgressRef.current = false
            setShowBattleAnimation(false)
            return
          }

          const result = resolveInterlinkBattle(playerBattleCard, opponentBattleCard)

          if (!result) {
            console.error('Failed to resolve INTERLINKED battle')
            battleInProgressRef.current = false
            setShowBattleAnimation(false)
            return
          }

          playerDead = result.playerEliminated
          opponentDead = result.opponentEliminated

          // Determine Winner and Message
          if (playerDead && opponentDead) {
            winner = 'tie'
            message = `MUTUAL ELIMINATION! Both cards destroyed. (Tied ${result.ties} traits, ${result.playerWins}-${result.opponentWins})`
            setPlayerDeck((prev: any[]) => prev.filter((id: string | number) => id !== playerBattleCard))
            setOpponentDeck((prev: any[]) => prev.filter((id: string | number) => id !== opponentBattleCard))
          } else if (opponentDead) {
            winner = 'player'
            message = `UNIT ELIMINATED! You won ${result.playerWins} of 12 traits. Opponent card destroyed.`
            // Add to Opponent Graveyard
            setOpponentGraveyard((prev: any[]) => {
              const originalTraits = originalCitizenTraitsRef.current[opponentBattleCard!] || citizenTraitsRef.current[opponentBattleCard!]
              if (!originalTraits) return prev
              if (prev.find(c => c.id === opponentBattleCard!)) return prev
              return [...prev, {
                id: opponentBattleCard!,
                eliminatedTurn: turnCount,
                originalTraits: JSON.parse(JSON.stringify(originalTraits))
              }]
            })
            setOpponentDeck((prev: any[]) => prev.filter((id: string | number) => id !== opponentBattleCard))
          } else if (playerDead) {
            winner = 'opponent'
            message = `UNIT LOST! Opponent won ${result.opponentWins} of 12 traits. Your card destroyed.`
            // Add to Player Graveyard
            setPlayerGraveyard((prev: GraveyardCard[]) => {
              const originalTraits = originalCitizenTraitsRef.current[playerBattleCard!] || citizenTraitsRef.current[playerBattleCard!]
              if (!originalTraits) return prev
              if (prev.find(c => c.id === playerBattleCard!)) return prev
              return [...prev, {
                id: playerBattleCard!,
                eliminatedTurn: turnCount,
                originalTraits: JSON.parse(JSON.stringify(originalTraits))
              }]
            })
            setPlayerDeck((prev: any[]) => prev.filter((id: string | number) => id !== playerBattleCard))
          } else {
            // No elimination, show trait battle results
            if (result.playerWins > result.opponentWins) {
              winner = 'player'
              message = `TRAIT VICTORY! You won ${result.playerWins} of 12 traits (${result.ties} tied)`
            } else if (result.opponentWins > result.playerWins) {
              winner = 'opponent'
              message = `TRAIT DEFEAT! Opponent won ${result.opponentWins} of 12 traits (${result.ties} tied)`
            } else {
              winner = 'tie'
              message = `STALEMATE! Tied ${result.playerWins}-${result.opponentWins} (${result.ties} draws). Both survive.`
            }
          }
        } else {
          // Standard logic for other modes
          const traitCategory = playerSelectedTrait!.split(': ')[0]

          if (gameMode === 'threat-intelligence' && opponentSelectedTrait!.includes('???')) {
            const oVal = getTraitValue(opponentSelectedTrait!, opponentTraits)
            setOpponentSelectedTrait(`${traitCategory}: ${oVal}`)
          }

          const pVal = getTraitValue(playerSelectedTrait!, playerTraits)
          const oVal = getTraitValue(opponentSelectedTrait!, opponentTraits)

          if (typeof pVal === 'number' && typeof oVal === 'number') {
            if (pVal > oVal) { winner = 'player'; message = `${traitCategory} ${pVal} Beats ${oVal}` }
            else if (oVal > pVal) { winner = 'opponent'; message = `${traitCategory} ${oVal} Beats ${pVal}` }
            else { winner = isPlayerTurn ? 'opponent' : 'player'; message = `${traitCategory} Tie! Defender wins` }
          } else {
            if (traitCategory === 'Reward') {
              const pNum = parseFloat(String(pVal)); const oNum = parseFloat(String(oVal))
              if (!isNaN(pNum) && !isNaN(oNum)) {
                if (pNum > oNum) { winner = 'player'; message = `${traitCategory}: ${pVal} Beats ${oVal}` }
                else if (oNum > pNum) { winner = 'opponent'; message = `${traitCategory}: ${oVal} Beats ${oVal}` }
                else { winner = isPlayerTurn ? 'opponent' : 'player'; message = `${traitCategory}: Tie! Defender wins` }
              } else {
                winner = isPlayerTurn ? 'opponent' : 'player'; message = `${traitCategory}: ${pVal} vs ${oVal} - Defender wins`
              }
            } else {
              const traitKey = getTraitKey(traitCategory)
              const pCount = getTraitCount(traitKey, String(pVal))
              const oCount = getTraitCount(traitKey, String(oVal))
              if (pCount < oCount) { winner = 'player'; message = `${traitCategory}: ${pVal} Beats ${oVal}` }
              else if (oCount < pCount) { winner = 'opponent'; message = `${traitCategory}: ${oVal} Beats ${pVal}` }
              else { winner = isPlayerTurn ? 'opponent' : 'player'; message = `${traitCategory}: Tie! Defender wins` }
            }
          }
        }

        setBattleResult({ winner, message, eliminated: playerDead || opponentDead })

        if (gameMode === 'interlinked') {
          // FIX: Store card IDs for report BEFORE any cleanup can happen
          setReportPlayerCard(playerBattleCard)
          setReportOpponentCard(opponentBattleCard)
          setShowBattleReport(true)
          setReportTimer(10)
        }

        setShowBattleAnimation(false)

        // Handle Scoring
        if (winner === 'player') {
          setPlayerScore((s: number) => s + 1)
        } else if (winner === 'opponent') {
          setOpponentScore((s: number) => s + 1)
        }

        // Handle Deck Persistence
        if (gameMode !== 'last-citizen-standing' && gameMode !== 'interlinked') {
          if (winner === 'player') opponentDead = true
          else if (winner === 'opponent') playerDead = true
        }

        if (playerDead) {
          setPlayerDeck((prev: number[]) => prev.filter(id => id !== playerBattleCard))
        }
        if (opponentDead) {
          setOpponentDeck((prev: number[]) => prev.filter(id => id !== opponentBattleCard))
        }

        // Turn progression is handled here for non-combat discards/timeouts
        if (gameMode !== 'interlinked') {
          setTurnCount((prev: number) => {
            const newTurnCount = prev + 1

            // Phase 12: Periodic Card Deal is now handled by Refresh Phase (lines 874-983)
            // The old automatic card draw logic has been removed to prevent conflicts

            return newTurnCount
          })

          setTimeout(() => {
            battleInProgressRef.current = false
            setBattleResult(null)
            setPlayerBattleCard(null)
            setSelectedBattleCard(null) // FIX: Explicitly clear selected card too
            setPlayerSelectedTrait(null)
            setPlayerSelectedSecondTrait(null)
            setOpponentBattleCard(null)
            setOpponentSelectedTrait(null)
            setOpponentSelectedSecondTrait(null)
            setIsPlayerTurn(prev => !prev)
            setTimer(30)
          }, 1500)
        }
      }, 1500)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerBattleCard, opponentBattleCard, battleResult, gameMode, battleRetryTrigger])

  // Phase 2: Elimination Logic
  const checkCardElimination = (cardId: number): boolean => {
    if (gameMode === 'interlinked') {
      const scores = cardTraitScores[cardId]
      if (!scores) return false
      const zeros = Object.values(scores).filter(v => v === 0).length
      return zeros >= 6
    } else if (gameMode === 'last-citizen-standing') {
      const traits = citizenTraits[cardId]
      if (!traits) return false
      const numVal = (v: any) => typeof v === 'number' ? v : (parseFloat(v) || 0)
      const traitsAtZero = [
        traits.strength, traits.intelligence, traits.cool,
        traits.techSkill, traits.attractiveness,
        numVal(traits.rewardRate)
      ].filter(v => v === 0).length
      return traitsAtZero >= 3
    }
    return false
  }


  const eliminateCard = (cardId: number, isPlayer: boolean) => {
    // Avoid duplicates
    // We check state directly in set functions to avoid closure staleness, 
    // but for the check here we might rely on current render state. 
    // Ideally we should use functional updates for all.

    console.log(`[ELIMINATION] Eliminating ${isPlayer ? 'Player' : 'Opponent'} Card ${cardId}`)



    // Add to Graveyard and Remove from Deck
    if (isPlayer) {
      setPlayerDeck(prev => prev.filter(id => id !== cardId))
      setPlayerGraveyard(prev => {
        if (prev.find(c => c.id === cardId)) return prev
        const traits = originalCitizenTraits[cardId] || citizenTraits[cardId]
        if (!traits) return prev
        return [...prev, {
          id: cardId,
          eliminatedTurn: turnCount,
          originalTraits: JSON.parse(JSON.stringify(traits))
        }]
      })
    } else {
      setOpponentDeck(prev => prev.filter(id => id !== cardId))
      setOpponentGraveyard(prev => {
        if (prev.find(c => c.id === cardId)) return prev
        const traits = originalCitizenTraits[cardId] || citizenTraits[cardId]
        if (!traits) return prev
        return [...prev, {
          id: cardId,
          eliminatedTurn: turnCount,
          originalTraits: JSON.parse(JSON.stringify(traits))
        }]
      })
    }
  }

  // Phase 5: Resurrection Logic
  const handleResurrect = () => {
    if (selectedGraveyardCard === null) return
    const cardId = selectedGraveyardCard
    const graveCard = playerGraveyard.find(c => c.id === cardId)
    if (!graveCard) return

    const { originalTraits } = graveCard

    // 1. Restore CitizenTraits (base)
    // We start with a copy of original traits
    const newTraits = { ...originalTraits }

    // 2. Apply Reductions based on Mode
    if (gameMode === 'last-citizen-standing') {
      const numericKeys: (keyof CitizenTraits)[] = ['strength', 'intelligence', 'cool', 'techSkill', 'attractiveness']
      numericKeys.forEach(key => {
        const val = newTraits[key] as number
        newTraits[key] = Math.ceil(val * 0.8)
      })
      const reward = parseFloat(String(newTraits.rewardRate)) || 0
      newTraits.rewardRate = String(Math.ceil(reward * 0.8))

      setCitizenTraits(prev => ({ ...prev, [cardId]: newTraits }))
    } else if (gameMode === 'interlinked') {
      // Restore traits to original (so descriptions are correct)
      setCitizenTraits(prev => ({ ...prev, [cardId]: newTraits }))

      // Calculate reduced scores
      const scores = getInitialTraitScores(cardId, newTraits)
      if (scores) {
        Object.keys(scores).forEach(k => {
          const key = k as keyof CardTraitScores
          scores[key] = Math.ceil(scores[key] * 0.8)
        })
        setCardTraitScores(prev => ({ ...prev, [cardId]: scores }))
      }
    } else {
      // Fallback for other modes
      setCitizenTraits(prev => ({ ...prev, [cardId]: newTraits }))
    }

    // 3. Move from Graveyard to Deck
    setPlayerDeck(prev => [...prev, cardId])
    setPlayerGraveyard(prev => prev.filter(c => c.id !== cardId))

    // 4. Close and Disable
    setAngieResurrectUsed(true)
    setShowAngieGraveyard(false)
    setSelectedGraveyardCard(null)

    // 5. Animations — green glow (not +50%)
    setResurrectCardHighlight(cardId)
    setTimeout(() => setResurrectCardHighlight(null), 3000)
    setEliminationNotice({ message: 'RESURRECTED', visible: true }) // Reuse notification for feedback? Or use dedicated UI text
    setTimeout(() => setEliminationNotice(null), 2000)
  }

  // Phase 11 & Phase 2: LCS & INTERLINKED Auto-Elimination Sweeper
  useEffect(() => {
    if (gameMode !== 'last-citizen-standing' && gameMode !== 'interlinked') return
    // Skip elimination during refresh phase - players are actively managing their deck
    if (isRefreshPhase) return

      // Check Player Deck
      ;[...playerDeck].forEach(id => {
        const cardId = Number(id)
        if (checkCardElimination(cardId)) {
          eliminateCard(cardId, true)
        }
      })

      // Check Opponent Deck
      ;[...opponentDeck].forEach(id => {
        const cardId = Number(id)
        if (checkCardElimination(cardId)) {
          eliminateCard(cardId, false)
        }
      })
  }, [citizenTraits, playerDeck, opponentDeck, gameMode, isRefreshPhase, cardTraitScores])

  // Phase 11: Robust Trait Loader (ensure all deck cards have traits)
  useEffect(() => {
    if (!gameStarted) return

    const allDeckCards = [...playerDeck, ...opponentDeck]
    const cardsToLoad = allDeckCards.filter(id => !citizenTraits[id])

    if (cardsToLoad.length > 0) {
      console.log(`Loading traits for ${cardsToLoad.length} cards:`, cardsToLoad)
      cardsToLoad.forEach(async (id) => {
        try {
          const traits = await fetchTraitsForCitizen(id)
          if (traits) {
            setCitizenTraits(prev => ({ ...prev, [id]: traits }))
            setOriginalCitizenTraits(prev => ({ ...prev, [id]: JSON.parse(JSON.stringify(traits)) }))
            console.log(`✓ Traits loaded for card #${id}`)
          } else {
            console.warn(`⚠ No traits returned for card #${id}`)
          }
        } catch (err) {
          console.error(`✗ Failed to load traits for card ${id}:`, err)
        }
      })
    }
  }, [playerDeck, opponentDeck, citizenTraits, gameStarted])

  // Central Game Over Logic — deferred until battle report/result is dismissed
  useEffect(() => {
    if (!gameStarted || gameOver || gamePhase !== 'battle') return
    // Wait for battle report and battle result to close before triggering game over
    if (showBattleReport || battleResult) return

    if (gameMode === 'last-citizen-standing' || gameMode === 'interlinked') {
      if (playerDeck.length === 0) {
        setGameOver('lose')
      } else if (opponentDeck.length === 0) {
        setGameOver('win')
      }
    } else {
      if (playerScore >= 5) {
        setGameOver('win')
      } else if (opponentScore >= 5) {
        setGameOver('lose')
      }
    }
  }, [playerDeck.length, opponentDeck.length, playerScore, opponentScore, gameMode, gameStarted, gameOver, showBattleReport, battleResult])


  // AI responds after player attacks (Non-LCS modes)
  useEffect(() => {
    if (playerBattleCard && playerSelectedTrait && !opponentBattleCard && isPlayerTurn && gameMode !== 'last-citizen-standing') {
      setTimeout(() => {
        const traitParts = playerSelectedTrait.split(': ')
        const traitCategory = traitParts[0]
        const traitValue = traitParts[1]
        const aiCardId = aiChooseCard(playerSelectedTrait, traitValue, true)

        setOpponentBattleCard(aiCardId)
        const aiTraits = citizenTraits[aiCardId]

        if (aiTraits) {
          // Existing logic for other modes
          // Get AI card's actual trait value for same category
          let aiTraitValue: string | number = ''
          switch (traitCategory) {
            case 'Class': aiTraitValue = aiTraits.class; break
            case 'Race': aiTraitValue = aiTraits.race; break
            case 'Eyes': aiTraitValue = aiTraits.eyes; break
            case 'Location': aiTraitValue = aiTraits.location; break
            case 'Item': aiTraitValue = aiTraits.additionalItem; break
            case 'Weapon': aiTraitValue = aiTraits.weapon; break
            case 'Vehicle': aiTraitValue = aiTraits.vehicle; break
            case 'Apparel': aiTraitValue = aiTraits.apparel; break
            case 'Helm': aiTraitValue = aiTraits.helm; break
            case 'Ability': aiTraitValue = aiTraits.ability; break
            case 'Strength': aiTraitValue = aiTraits.strength; break
            case 'Intelligence': aiTraitValue = aiTraits.intelligence; break
            case 'Cool': aiTraitValue = aiTraits.cool; break
            case 'Tech Skill': aiTraitValue = aiTraits.techSkill; break
            case 'Attractiveness': aiTraitValue = aiTraits.attractiveness; break
            case 'Reward': aiTraitValue = typeof aiTraits.rewardRate === 'string' ? parseFloat(aiTraits.rewardRate) : aiTraits.rewardRate; break
            default: aiTraitValue = 0
          }

          if (gameMode === 'threat-intelligence') {
            setOpponentSelectedTrait(`${traitCategory}: ???`)
          } else {
            setOpponentSelectedTrait(`${traitCategory}: ${aiTraitValue}`)
          }
        }
        setTimer(30)
      }, 1500)
    }
  }, [playerBattleCard, playerSelectedTrait, opponentBattleCard, isPlayerTurn, gameMode])

  // AI Turn Logic for LCS mode
  useEffect(() => {
    // console.log(`[DEBUG] AI Turn Check: Mode=${gameMode}, PlayerTurn=${isPlayerTurn}, PBC=${playerBattleCard}, OBC=${opponentBattleCard}, Res=${battleResult}, Refresh=${isRefreshPhase}, Deck=${opponentDeck.length}, Turn=${turnCount}`)


    // Failsafe: Correct gamePhase if incorrectly in 'discard' after game start (Turn > 0)
    if (turnCount > 0 && (gamePhase === 'discard' || gamePhase === 'rps')) {
      console.warn('[FIX] Detected gamePhase "discard" or "rps" on Turn > 0. Forcing "battle".')
      setGamePhase('battle')
    }

    if ((gameMode === 'last-citizen-standing' || gameMode === 'interlinked') && !isPlayerTurn && !playerBattleCard && !opponentBattleCard && !battleResult && !isRefreshPhase && !gameOver && opponentDeck.length > 0 && (turnCount === 0 || turnCount % 10 !== 0)) {
      console.log('[DEBUG] AI Turn Triggered!')

      const aiMoveSequence = async () => {
        // Step 1: Thinking delay (1.5s)
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Step 1.5: SUMMON ABILITY CONSIDERATION
        const decision = opponentConsiderSummonAbility();
        if (decision) {
          await executeOpponentSummonAbility(decision);
          // Wait after ability effects
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Check if we can still make a move
        if (opponentBattleCard || playerBattleCard || battleResult || isRefreshPhase) return;

        // Step 2: AI Picks Attacker
        const aiCardId = aiChooseCard('Average', '0', false)
        if (!aiCardId) return;
        setOpponentBattleCard(aiCardId)

        // Step 3: Targeting Phase (Visual Feedback Integration)
        await new Promise(resolve => setTimeout(resolve, 200));

        // AI Picks Target (Lowest average stats)
        const sortedPlayerDeck = [...playerDeck].sort((a, b) => {
          const tA = citizenTraits[a]
          const tB = citizenTraits[b]
          if (!tA || !tB) return 0
          const avgA = (tA.strength + tA.intelligence + tA.cool + tA.techSkill + tA.attractiveness) / 5
          const avgB = (tB.strength + tB.intelligence + tB.cool + tB.techSkill + tB.attractiveness) / 5
          return avgA - avgB
        })
        const targetId = sortedPlayerDeck[0]

        // NEW: Visual Feedback Sequence
        // 1. Set Target ID (Triggers Red Highlight & Gold Line)
        setOpponentTargetCard(targetId)

        // 2. Set Targeting Source (for Gold Line origin)
        setIsTargeting(true)

        // 3. Set Target Rect (for Gold Line destination)
        const targetEl = document.querySelector(`[data-card-id="${targetId}"]`)
        if (targetEl) {
          const rect = targetEl.getBoundingClientRect()
          setHoveredTargetRect({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
        } else {
          setHoveredTargetRect({ x: window.innerWidth / 2, y: window.innerHeight - 100 })
        }

        // Step 4: Display Phase (1.0s duration)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Clear Visuals
        setOpponentTargetCard(null)
        setIsTargeting(false)
        setHoveredTargetRect(null)

        // Set Pending Target to trigger Conflict Modal
        setPendingTarget(targetId)

        // Step 5: Auto-initiate Clash (2.5s)
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Only proceed if we're still in this state
        // Safety: ensure ref is clear so battle effect can fire
        battleInProgressRef.current = false;
        setPlayerBattleCard(targetId)
        setPendingTarget(null)
      }

      aiMoveSequence();
    }
  }, [isPlayerTurn, opponentDeck, playerDeck, gameMode, playerBattleCard, opponentBattleCard, battleResult, isRefreshPhase, gameOver, turnCount, opponentDarkLordUsed, opponentAngelicUsed, opponentAngieUsed])


  // Keyboard Shortcuts for Conflict Modal
  useEffect(() => {
    if (!pendingTarget || battleResult || !isPlayerTurn) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys
      if (['ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft') {
        setPendingTarget((prev: string | number | null) => {
          if (!prev) return prev;
          const currentIndex = opponentDeck.findIndex((id: string | number) => id === prev);
          // If not found, default to 0
          if (currentIndex === -1) return opponentDeck.length > 0 ? opponentDeck[0] : null;

          const prevIndex = currentIndex > 0 ? currentIndex - 1 : opponentDeck.length - 1;
          return opponentDeck[prevIndex];
        });
      } else if (e.key === 'ArrowRight') {
        setPendingTarget((prev: string | number | null) => {
          if (!prev) return prev;
          const currentIndex = opponentDeck.findIndex((id: string | number) => id === prev);
          if (currentIndex === -1) return opponentDeck.length > 0 ? opponentDeck[0] : null;

          const nextIndex = currentIndex < opponentDeck.length - 1 ? currentIndex + 1 : 0;
          return opponentDeck[nextIndex];
        });
      } else if (e.key === 'Enter') {
        // Trigger Initiate Clash
        if (!selectedBattleCard || !pendingTarget) return;
        battleInProgressRef.current = false;
        setPlayerBattleCard(selectedBattleCard);
        setOpponentBattleCard(pendingTarget);
        setPendingTarget(null);
        setIsTargeting(false);
        setHoveredTargetRect(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingTarget, battleResult, isPlayerTurn, opponentDeck, setOpponentBattleCard, setPendingTarget, setIsTargeting, setHoveredTargetRect]);


  // Phase 5: Check for refresh phase every 10 turns (LCS & INTERLINKED modes)
  useEffect(() => {
    if (gameMode !== 'last-citizen-standing' && gameMode !== 'interlinked') return

    // Turn 10, 20, 30 etc.
    if (turnCount > 0 && turnCount % 10 === 0 && !isRefreshPhase && !playerRefreshDiscarded) {
      console.log(`[DEBUG] Initiating Refresh Phase for turn ${turnCount}`)

      // Normalize all IDs to numbers for reliable comparison
      // Include graveyard cards to prevent drawing eliminated cards back
      const usedIds = new Set([
        ...playerDeck.map(id => Number(id)),
        ...opponentDeck.map(id => Number(id)),
        ...discardedCards.map(id => Number(id)),
        ...playerGraveyard.map(c => Number(c.id)),
        ...opponentGraveyard.map(c => Number(c.id))
      ])
      const vCitizens = citizens.filter(c => c.loaded)

      let pDraw: number | null = null
      let aDraw: number | null = null

      // Try to find available citizens from loaded ones first
      for (const c of vCitizens) {
        if (!usedIds.has(c.id)) {
          if (!pDraw) pDraw = c.id
          else if (!aDraw) { aDraw = c.id; break }
        }
      }

      // Add pDraw to usedIds so aDraw can't be the same
      if (pDraw) usedIds.add(pDraw)

      // Fallback to random if needed
      if (!pDraw || !aDraw) {
        const allIds = Array.from({ length: 3968 }, (_, i) => i + 1).filter(id => !usedIds.has(id))
        const pick = () => {
          if (allIds.length === 0) return null
          const idx = Math.floor(Math.random() * allIds.length)
          const id = allIds[idx]
          allIds.splice(idx, 1)
          return id
        }
        if (!pDraw) {
          pDraw = pick()
          if (pDraw) usedIds.add(pDraw)
        }
        if (!aDraw) aDraw = pick()
      }

      console.log(`[DEBUG] Refresh Picks - Player: ${pDraw}, AI: ${aDraw}`)

      // 1. Set Phase Flags
      setIsRefreshPhase(true)
      setPlayerRefreshDiscarded(false)
      setAiRefreshDiscarded(false)
      setRefreshDrawnCard(pDraw)
      setAiRefreshDrawnCard(aDraw)
      setLastRefreshCard(pDraw) // Protect the new player card immediately
      setIsTargeting(false)
      setPendingTarget(null)
      // FIX: Clear hover state to prevent popup during refresh
      setHoveredDeckCard(null)
      // 2. INJECT DRAWN CARDS IMMEDIATELY (Force deck sync)
      if (pDraw) {
        setPlayerDeck((prev: number[]) => {
          const list = prev.map(id => Number(id));
          if (!list.includes(pDraw)) {
            console.log(`[DEBUG] Injecting Player Card ${pDraw} into FRONT of deck tray.`);
            return [pDraw, ...list]; // Front-load for visibility
          }
          return list;
        });

        // Force trait scores for Interlinked mode immediately
        if (gameMode === 'interlinked') {
          const scores = getInitialTraitScores(pDraw);
          if (scores) {
            setCardTraitScores(prev => ({ ...prev, [pDraw]: scores }));
            console.log(`[DEBUG] Forced Interlinked Scores for draw card ${pDraw}`);
          }
        }
      }
      if (aDraw) {
        setOpponentDeck((prev: number[]) => {
          const list = prev.map(id => Number(id));
          if (!list.includes(aDraw)) {
            console.log(`[DEBUG] Injecting AI Card ${aDraw} into AI deck.`);
            return [aDraw, ...list];
          }
          return list;
        });

        // Force trait scores for Interlinked mode immediately (mirrors player card logic)
        if (gameMode === 'interlinked') {
          const scores = getInitialTraitScores(aDraw);
          if (scores) {
            setCardTraitScores(prev => ({ ...prev, [aDraw]: scores }));
            console.log(`[DEBUG] Forced Interlinked Scores for AI draw card ${aDraw}`);
          }
        }
      }

      // Auto-open modal with first card selected to streamline UI
      if (playerDeck.length > 0) {
        setSelectedForDiscard(Number(playerDeck[0]))
      }
    }
  }, [turnCount, gameMode, isRefreshPhase, playerRefreshDiscarded, playerDeck, opponentDeck, discardedCards, citizens])

  // Helper effect to load traits for the new refresh cards
  useEffect(() => {
    const loadIfNeeded = async (id: number | null) => {
      if (id && !citizenTraits[id]) {
        console.log(`[DEBUG] Pre-loading traits for refresh card ${id}`)
        const traits = await fetchTraitsForCitizen(id)
        if (traits) {
          setCitizenTraits(prev => ({ ...prev, [id]: traits }))
          if (gameMode === 'interlinked') {
            const scores = getInitialTraitScores(id)
            if (scores) setCardTraitScores(prev => ({ ...prev, [id]: scores }))
          }
        }
      }
    }
    if (isRefreshPhase) {
      loadIfNeeded(refreshDrawnCard)
      loadIfNeeded(aiRefreshDrawnCard)
    }
  }, [isRefreshPhase, refreshDrawnCard, aiRefreshDrawnCard, citizenTraits, gameMode])

  // AI Refresh Action Effect
  useEffect(() => {
    if (!isRefreshPhase || aiRefreshDiscarded || !aiRefreshDrawnCard) return

    console.log(`[DEBUG] AI Refresh logic triggered. AI Deck Size: ${opponentDeck.length}`)

    const aiAction = setTimeout(() => {
      // Logic: Pick the weakest of the 10 cards to remove
      if (opponentDeck.length > 0) {
        const weakestCardId = opponentDeck.reduce((weakest, cardId) => {
          const traits = citizenTraits[cardId]
          const weakestTraits = citizenTraits[weakest]
          if (!traits) return weakest
          if (!weakestTraits) return cardId

          const getPower = (t: CitizenTraits) => (t.strength || 0) + (t.intelligence || 0) + (t.cool || 0) + (t.techSkill || 0) + (t.attractiveness || 0) + (typeof t.rewardRate === 'number' ? t.rewardRate : parseFloat(t.rewardRate) || 0)
          return getPower(traits) < getPower(weakestTraits) ? cardId : weakest
        }, opponentDeck[0])

        console.log(`[DEBUG] AI Refreshing: Removing weakest card ${weakestCardId}`)
        setOpponentDeck((prev: number[]) => {
          const normalizedWeakest = Number(weakestCardId)
          const newDeck = prev.filter(id => Number(id) !== normalizedWeakest).map(id => Number(id))
          console.log(`[DEBUG] AI Deck updated (removal only). New size: ${newDeck.length}`)
          return newDeck
        })
      }
      setAiRefreshDiscarded(true)
    }, 800)

    return () => clearTimeout(aiAction)
  }, [isRefreshPhase, aiRefreshDiscarded, aiRefreshDrawnCard, opponentDeck])

  // Combined transition effect
  useEffect(() => {
    if (!isRefreshPhase || !playerRefreshDiscarded || !aiRefreshDiscarded) return

    console.log('[DEBUG] Both players finished refresh, transitioning to battle')

    const timer = setTimeout(() => {
      // 1. Force state synchronization check
      const pCard = Number(refreshDrawnCard);
      const aCard = Number(aiRefreshDrawnCard);

      if (pCard) {
        setPlayerDeck((prev: number[]) => {
          const list = prev.map(id => Number(id));
          if (!list.includes(pCard)) {
            console.log(`[DEBUG] Final transition check: Force injecting card ${pCard} to FRONT`);
            return [pCard, ...list];
          }
          // Also ensure it is at the front if already there
          const filtered = list.filter(id => id !== pCard);
          return [pCard, ...filtered];
        });
      }

      if (aCard) {
        setOpponentDeck((prev: number[]) => {
          const list = prev.map(id => Number(id));
          if (!list.includes(aCard)) {
            console.log(`[DEBUG] Final AI transition check: Force injecting AI card ${aCard} to FRONT`);
            return [aCard, ...list];
          }
          const filtered = list.filter(id => id !== aCard);
          return [aCard, ...filtered];
        });
      }

      // 2. Perform phase transition
      setIsRefreshPhase(false)
      setPlayerRefreshDiscarded(false)
      setAiRefreshDiscarded(false)
      setRefreshDrawnCard(null)
      setAiRefreshDrawnCard(null)
      setSelectedForDiscard(null)
      setTurnCount(prev => prev + 1)
      setIsPlayerTurn(true)
      setTimer(30)
      console.log('[DEBUG] Refresh Phase ended. Turn advanced.')
    }, 400)
    return () => clearTimeout(timer)
  }, [isRefreshPhase, playerRefreshDiscarded, aiRefreshDiscarded, refreshDrawnCard, aiRefreshDrawnCard])

  // Failsafe Refresh Phase Transition (ensure game never stops)
  useEffect(() => {
    if (!isRefreshPhase) return

    const failsafe = setTimeout(() => {
      if (isRefreshPhase) {
        console.warn('[WARNING] Refresh Phase failsafe triggered. Forcing phase end.')
        setIsRefreshPhase(false)
        setPlayerRefreshDiscarded(false)
        setAiRefreshDiscarded(false)
        setRefreshDrawnCard(null)
        setAiRefreshDrawnCard(null)
        setSelectedForDiscard(null)
        setTurnCount(prev => prev + 1)
      }
    }, 15000)

    return () => clearTimeout(failsafe)
  }, [isRefreshPhase])


  // Global Timer - Only runs during player's active turn
  useEffect(() => {
    // Timer should RUN when:
    const shouldTimerRun =
      isPlayerTurn &&                      // Player's turn
      (gamePhase === 'battle' || gamePhase === 'discard') && // Battle or discard phase
      !playerBattleCard &&                 // Player hasn't clicked INITIATE CLASH yet
      !battleResult &&                     // No battle result showing
      !gameOver &&                         // Game not over
      !showAngieGraveyard &&               // Not in graveyard modal
      !isRefreshPhase                      // Not in refresh phase
      // Note: timer <= 0 handled by interval self-clearing

    // NOTE: Removed check for selectedBattleCard and activeSummon - timer continues during CONFIRM ATTACK

    if (!shouldTimerRun) {
      return // Don't run timer
    }

    // Start countdown
    const intervalId = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(intervalId)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Cleanup
    return () => clearInterval(intervalId)
  }, [
    isPlayerTurn,
    gamePhase,
    playerBattleCard, // Timer stops when this becomes non-null (on Initiate Clash)
    battleResult,
    gameOver,
    showAngieGraveyard,
    isRefreshPhase
  ])

  // Reset timer to 30 at Start of Each Player Turn
  useEffect(() => {
    // Conditions for turn start:
    // - It's player's turn
    // - In battle phase
    // - No active battle card (hasn't attacked yet)
    // - No battle result showing
    if (
      isPlayerTurn &&
      gamePhase === 'battle' &&
      !playerBattleCard &&
      !battleResult
    ) {
      setTimer(30)
      console.log('🔄 Player turn started - Timer reset to 30')
    }
  }, [isPlayerTurn, gamePhase, playerBattleCard, battleResult])

  // Timer Expiry Logic
  useEffect(() => {
    if (timer > 0) return

    // Time's up!
    if (gamePhase === 'discard' && discardedCards.length < 3) {
      const availableCards = validCitizens.slice(0, 12).filter(c => !discardedCards.includes(c.id))
      const remaining = 3 - discardedCards.length
      const toDiscard = [...discardedCards]

      for (let i = 0; i < remaining; i++) {
        const randomIndex = Math.floor(Math.random() * availableCards.length)
        toDiscard.push(availableCards[randomIndex].id)
        availableCards.splice(randomIndex, 1)
      }

      setDiscardedCards(toDiscard)

      const allValid = validCitizens.slice(0, 12)
      const playerCards = allValid.filter(c => !toDiscard.includes(c.id)).map(c => c.id)
      setPlayerDeck(playerCards)

      const aiCards = validCitizens.slice(12, 24)
      const aiCardsWithPower = aiCards.map(card => {
        const traits = citizenTraits[card.id]
        if (!traits) return { id: card.id, power: Math.random() * 100 }
        const power = traits.strength + traits.intelligence + traits.cool + traits.techSkill + traits.attractiveness
        return { id: card.id, power }
      })
      aiCardsWithPower.sort((a, b) => b.power - a.power)
      const aiDeck = aiCardsWithPower.slice(0, 9).map(c => c.id)
      setOpponentDeck(aiDeck)

      // INTERLINKED mode: Initialize trait scores for all cards
      if (gameMode === 'interlinked') {
        const allCards = [...playerCards, ...aiDeck]
        const initialScores: Record<number, CardTraitScores> = {}

        allCards.forEach(cardId => {
          const scores = getInitialTraitScores(cardId)
          if (scores) {
            initialScores[cardId] = scores
          }
        })

        setCardTraitScores(initialScores)
      }

      setGamePhase('rps')
    } else if (gamePhase === 'battle' && isPlayerTurn) {
      // Timer expired during player's turn - force the player to make a move

      // Safety: ensure battleInProgressRef is cleared (previous battle should be done by now)
      if (battleInProgressRef.current) {
        console.warn('[TIMER] battleInProgressRef was stuck true — resetting')
        battleInProgressRef.current = false
      }

      // Case 1: Player has a card on battlefield (or selected) and a pending target - force the attack
      if ((playerBattleCard || selectedBattleCard) && pendingTarget) {
        const attackerId = playerBattleCard || selectedBattleCard;
        console.log('Timer expired - forcing attack with pending target:', pendingTarget)
        if (!playerBattleCard) setPlayerBattleCard(attackerId);
        setOpponentBattleCard(pendingTarget)
        setPendingTarget(null)
        setIsTargeting(false)
        setHoveredTargetRect(null)
        setTimer(30)
        return
      }

      // Case 2: Player has a card selected but is in targeting mode - choose random target and attack
      if ((playerBattleCard || selectedBattleCard) && (isTargeting || !opponentBattleCard)) {
        const attackerId = playerBattleCard || selectedBattleCard;
        if (!playerBattleCard) setPlayerBattleCard(attackerId);
        const randomTarget = opponentDeck[Math.floor(Math.random() * opponentDeck.length)]
        if (randomTarget) {
          console.log('Timer expired - forcing attack on random target:', randomTarget)
          setOpponentBattleCard(randomTarget)
          setIsTargeting(false)
          setPendingTarget(null)
          setHoveredTargetRect(null)
          setTimer(30)
          return
        }
      }

      // Case 3: Player hasn't selected/deployed a card yet - deploy random card and attack random target
      if (!playerBattleCard && !selectedBattleCard) {
        const availableCards = playerDeck.filter((id: number) => Number(id) !== Number(playerBattleCard))
        if (availableCards.length > 0 && opponentDeck.length > 0) {
          const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)]
          const randomTarget = opponentDeck[Math.floor(Math.random() * opponentDeck.length)]
          console.log('Timer expired - deploying random card and attacking:', randomCard, 'vs', randomTarget)

          setPlayerBattleCard(randomCard)
          setOpponentBattleCard(randomTarget)
          setTimer(30)
        }
      }
    }
  }, [timer, gameStarted, gamePhase, validCitizens, discardedCards, playerBattleCard, selectedBattleCard, playerDeck, opponentDeck, opponentBattleCard, citizenTraits, pendingTarget, isTargeting, isPlayerTurn, showBattleReport])

  // Removed: Timer reset when card is retracted - timer should keep running continuously

  useEffect(() => {
    // Pre-fetch traits for first 24 valid cards (12 for player, 12 for AI)
    if (gamePhase === 'discard' && validCitizens.length >= 24) {
      // Show discard message for 2 seconds - only once
      if (!discardMessageShown.current) {
        discardMessageShown.current = true
        setShowDiscardMessage(true)
        setTimeout(() => {
          setShowDiscardMessage(false)
        }, 2000)
      }
    }
  }, [gamePhase, validCitizens])

  useEffect(() => {
    if (selectedForDiscard && gamePhase === 'discard') {
      getTraitsForCitizen(selectedForDiscard)
    }
  }, [selectedForDiscard, gamePhase])

  useEffect(() => {
    if (selectedBattleCard && gamePhase === 'battle') {
      getTraitsForCitizen(selectedBattleCard)
    }
  }, [selectedBattleCard, gamePhase])

  // Keyboard navigation for discard phase
  useEffect(() => {
    if (selectedForDiscard === null || gamePhase !== 'discard') return

    const handleKeyDown = (e: KeyboardEvent) => {
      const availableCards = validCitizens.slice(0, 12).filter((c: CitizenCard) => !discardedCards.includes(c.id))
      const currentIndex = availableCards.findIndex((c: CitizenCard) => c.id === selectedForDiscard)

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : availableCards.length - 1
        setSelectedForDiscard(availableCards[prevIndex].id)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        const nextIndex = currentIndex < availableCards.length - 1 ? currentIndex + 1 : 0
        setSelectedForDiscard(availableCards[nextIndex].id)
      } else if (e.key === 'Escape') {
        setSelectedForDiscard(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedForDiscard, validCitizens, discardedCards, gamePhase])

  // Keyboard navigation for battle phase (player deck card selection)
  useEffect(() => {
    if (selectedBattleCard === null || gamePhase !== 'battle' || pendingTarget) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = playerDeck.findIndex((id: number) => id === selectedBattleCard)

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : playerDeck.length - 1
        setSelectedBattleCard(playerDeck[prevIndex])
        setSelectedTrait(null)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        const nextIndex = currentIndex < playerDeck.length - 1 ? currentIndex + 1 : 0
        setSelectedBattleCard(playerDeck[nextIndex])
        setSelectedTrait(null)
      } else if (e.key === 'Escape') {
        setSelectedBattleCard(null)
        setSelectedTrait(null)
        // Add retraction logic
        setPlayerBattleCard(null)
        setIsTargeting(false)
        setHoveredTargetRect(null)
        if (activeSummon) setActiveSummon(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedBattleCard, playerDeck, gamePhase, pendingTarget])

  // Handle Battle Report Close (Manual or Timer)
  const handleReportClose = () => {
    setShowBattleReport(false);
    setBattleLog(null);
    setReportTimer(10);

    // FIX: Clear stored report card IDs
    setReportPlayerCard(null);
    setReportOpponentCard(null);

    // Show TARGET ELIMINATED / UNIT LOST box for 2s after report closes, then proceed
    // Reset battle ref immediately so next battle isn't blocked
    battleInProgressRef.current = false;
    setPlayerBattleCard(null);
    setOpponentBattleCard(null);
    setSelectedBattleCard(null);

    setTimeout(() => {
      setBattleResult(null);
      setTurnCount((prev: number) => prev + 1);
      setIsPlayerTurn(prev => !prev);
      setTimer(30);
    }, 2000);
  };

  // Keyboard shortcut for closing Battle Report
  useEffect(() => {
    if (!showBattleReport) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleReportClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showBattleReport]);

  // Battle Report Timer - Single effect with proper cleanup
  useEffect(() => {
    if (!showBattleReport) return

    // Initialize timer to 10 when report first appears
    setReportTimer(10)

    // Track if this effect instance is still active
    let active = true

    const countdownInterval = setInterval(() => {
      setReportTimer((prev: number) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          // Defer close to avoid setState-during-render issues
          if (active) {
            setTimeout(() => handleReportClose(), 0)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      active = false
      clearInterval(countdownInterval)
    }
  }, [showBattleReport])

  return (
    <div className="relative w-screen min-h-screen overflow-hidden flex flex-col items-center justify-start" onClick={() => {
      if (activeSummon) {
        setIsTargeting(false);
      }
      setActiveSummon(null);
    }}>
      <div
        className="absolute inset-0 bg-no-repeat bg-cover"
        style={{
          backgroundImage:
            "url('https://raw.githubusercontent.com/badfuture-926/neo-tokyo-card-clash/images/Neo%20Tokyo%20Card%20Clash%20Background.png')",
          backgroundPosition: "calc(50% + 40px) 15%",
        }}
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-black/40 to-black/80" />

      {/* Targeting Lines - gold (attack), purple (DL), blue (AO). Hidden during all modals & game over. */}
      {!showBattleReport && !battleResult && !showAngieGraveyard && !gameOver && !pendingTarget && (
        (opponentActiveSummon === 'dark-lord' && opponentSummonTarget) ||
        (opponentActiveSummon === 'angelic-overlord' && opponentSummonTarget) ||
        (isTargeting && hoveredTargetRect && (playerBattleCard || selectedBattleCard || opponentBattleCard || activeSummon !== null))
      ) && (
        <svg
          className="fixed inset-0 w-screen h-screen pointer-events-none z-[200]"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="goldLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
              <stop offset="50%" stopColor="#fcd34d" stopOpacity="1" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
            </linearGradient>
            <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <line
            x1={(() => {
              // Opponent Summons
              if (opponentActiveSummon === 'angelic-overlord' && opponentSummonTarget) {
                const btn = opponentSummonAngelicRef.current;
                if (btn) {
                  const rect = btn.getBoundingClientRect();
                  return rect.left + rect.width / 2;
                }
              }
              if (opponentActiveSummon === 'dark-lord' && opponentSummonTarget) {
                const btn = opponentSummonDarkLordRef.current;
                if (btn) {
                  const rect = btn.getBoundingClientRect();
                  return rect.left + rect.width / 2;
                }
              }

              // Player Summons
              if (activeSummon === 'angelic' && isPlayerTurn) {
                const btn = document.getElementById('summon-angelic');
                if (btn) {
                  const rect = btn.getBoundingClientRect();
                  return rect.left + rect.width / 2;
                }
              }
              if (activeSummon === 'darklord' && isPlayerTurn) {
                const btn = document.getElementById('summon-darklord');
                if (btn) {
                  const rect = btn.getBoundingClientRect();
                  return rect.left + rect.width / 2;
                }
              }
              // Standard targeting
              const cardId = isPlayerTurn ? 'player-battle-card' : 'opponent-battle-card';
              const card = document.getElementById(cardId);
              if (card) {
                const rect = card.getBoundingClientRect();
                return rect.left + rect.width / 2;
              }
              return 0;
            })()}
            y1={(() => {
              if (opponentActiveSummon === 'angelic-overlord' && opponentSummonTarget) {
                const btn = opponentSummonAngelicRef.current;
                if (btn) {
                  const rect = btn.getBoundingClientRect();
                  return rect.top + rect.height / 2;
                }
              }
              if (opponentActiveSummon === 'dark-lord' && opponentSummonTarget) {
                const btn = opponentSummonDarkLordRef.current;
                if (btn) {
                  const rect = btn.getBoundingClientRect();
                  return rect.top + rect.height / 2;
                }
              }

              if (activeSummon === 'angelic' && isPlayerTurn) {
                const btn = document.getElementById('summon-angelic');
                if (btn) {
                  const rect = btn.getBoundingClientRect();
                  return rect.top + rect.height / 2;
                }
              }
              if (activeSummon === 'darklord' && isPlayerTurn) {
                const btn = document.getElementById('summon-darklord');
                if (btn) {
                  const rect = btn.getBoundingClientRect();
                  return rect.top + rect.height / 2;
                }
              }
              const cardId = isPlayerTurn ? 'player-battle-card' : 'opponent-battle-card';
              const card = document.getElementById(cardId);
              if (card) {
                const rect = card.getBoundingClientRect();
                return rect.top + rect.height / 2;
              }
              return 0;
            })()}
            x2={(() => {
              if (opponentActiveSummon && opponentSummonTarget) {
                const targetRef = opponentActiveSummon === 'dark-lord'
                  ? playerDeckRefs.current[opponentSummonTarget]
                  : opponentDeckRefs.current[opponentSummonTarget];
                if (targetRef) {
                  const rect = targetRef.getBoundingClientRect();
                  return rect.left + rect.width / 2;
                }
              }
              return hoveredTargetRect?.x || 0;
            })()}
            y2={(() => {
              if (opponentActiveSummon && opponentSummonTarget) {
                const targetRef = opponentActiveSummon === 'dark-lord'
                  ? playerDeckRefs.current[opponentSummonTarget]
                  : opponentDeckRefs.current[opponentSummonTarget];
                if (targetRef) {
                  const rect = targetRef.getBoundingClientRect();
                  return rect.top + rect.height / 2;
                }
              }
              return hoveredTargetRect?.y || 0;
            })()}
            stroke={opponentActiveSummon === 'angelic-overlord' ? "#0090ff" : opponentActiveSummon === 'dark-lord' ? "#a855f7" : activeSummon === 'angelic' ? "#0090ff" : activeSummon === 'darklord' ? "#a855f7" : (!isPlayerTurn && !opponentTargetCard) ? "#ef4444" : "url(#goldLineGradient)"}
            strokeWidth="4"
            strokeLinecap="round"
            filter={(!isPlayerTurn && !opponentActiveSummon) ? undefined : "url(#goldGlow)"}
            className="animate-pulse"
          />
        </svg>
      )}

      {/* Opponent Resurrect Notification */}
      {showOpponentResurrectNotification?.visible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="bg-black/90 border-2 border-yellow-500/50 rounded-2xl p-8 flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(234,179,8,0.3)] animate-in zoom-in duration-300 pointer-events-auto">
            <div className="text-yellow-500 text-xs font-black uppercase tracking-[0.4em]">Emergency Resurrection</div>
            <div className="text-white text-4xl font-black italic tracking-tighter">ANGIE DEPLOYED</div>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-yellow-500/30">
                <img src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${showOpponentResurrectNotification.cardId}.png`} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="text-left">
                <div className="text-white font-bold">Citizen #{showOpponentResurrectNotification.cardId}</div>
                <div className="text-yellow-500/70 text-sm">Resurrected at 80% Efficiency</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <h1 className="sr-only">Neo Tokyo Card Clash</h1>

      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen gap-8 p-4">
        {!gameStarted && (
          <>
            {showGameModes ? (
              <div className="flex flex-col items-center gap-8 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 mt-[30vh]">


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  {(Object.entries(GAME_MODE_CONFIG) as [GameModeKey, typeof GAME_MODE_CONFIG[GameModeKey]][]).map(([modeKey, config]) => (
                    <button
                      key={modeKey}
                      className={`btn-mode ${config.styleClass} group relative overflow-hidden ${!config.enabled ? 'cursor-not-allowed opacity-60' : ''}`}
                      onClick={() => startGameWithMode(modeKey)}
                      disabled={!config.enabled}
                    >
                      <div className={`transition-all duration-300 ${!config.enabled ? 'group-hover:opacity-0 group-hover:blur-sm' : ''}`}>
                        <div className="type-title mb-2">{config.displayName}</div>
                        <div className="type-body text-xs opacity-70 group-hover:opacity-100">{config.description}</div>
                      </div>

                      {/* System Offline Overlay */}
                      {!config.enabled && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                          <span className="font-bold text-yellow-400 tracking-[0.2em] text-sm italic uppercase drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                            SYSTEM OFFLINE
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  className="mt-4 text-white/40 hover:text-white uppercase tracking-widest text-xs font-bold transition-colors"
                  onClick={() => setShowGameModes(false)}
                >
                  <span className="mr-2">←</span> Abort Sequence
                </button>
              </div>
            ) : !isLoading ? (
              <div className="flex flex-col gap-6 w-full max-w-md animate-in zoom-in duration-500">
                {/* Title removed as it exists in background */}
                <div className="h-32"></div>

                <button
                  className="btn-premium px-12 py-6 flex items-center justify-center gap-4 group"
                  onClick={startGame}
                >
                  <span className="text-2xl font-black italic tracking-tighter text-white">INITIATE CLASH</span>
                </button>

                <button
                  className="px-12 py-6 border border-white/10 bg-black/80 rounded-xl flex items-center justify-center relative overflow-hidden group cursor-not-allowed opacity-60"
                  disabled
                >
                  <span className="text-xl font-bold text-white/40 tracking-widest uppercase group-hover:opacity-0 transition-opacity">Multiplayer</span>
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-yellow-400 tracking-widest text-sm">
                    SYSTEM OFFLINE
                  </span>
                </button>

                <button
                  className="text-[#0090ff]/60 hover:text-[#0090ff] font-bold uppercase tracking-widest text-xs mt-4 transition-colors"
                  onClick={() => setShowRules(!showRules)}
                >
                  {showRules ? 'Close Database' : 'View Mission Protocols'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-8 animate-in fade-in duration-1000">
                <div className="loader-crate">
                  <div className="loader-core" />
                </div>
                <div className="text-center space-y-2">
                  <div className="type-title text-[#0090ff] animate-pulse">System Initializing</div>
                  <div className="type-meta">Loading Assets...</div>
                </div>
              </div>
            )}

            {showRules && (
              <div className="mt-8 bg-black/90  border border-[#0090ff]/30 rounded-2xl p-8 max-w-3xl shadow-2xl shadow-[#002244]/20 animate-in slide-in-from-bottom-4">
                <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                  <h2 className="type-title text-white">Mission Protocols</h2>
                  <div className="type-meta text-[#0090ff]">v2.0.0</div>
                </div>

                <div className="space-y-6 text-sm text-gray-400 leading-relaxed">
                  {/* Core Rules */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="text-white font-bold uppercase tracking-wider text-xs border-l-2 border-[#0090ff] pl-3">Deployment</div>
                      <p>Draw 12 Citizens from the Neo Tokyo distinct set. Discard the 3 weakest assets to optimize your hand. Enter combat with 9 elite units.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-white font-bold uppercase tracking-wider text-xs border-l-2 border-purple-500 pl-3">Engagement</div>
                      <p>Combat mechanics vary by mode. Standard modes use trait selection; advanced modes use automatic simultaneous battles.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-white font-bold uppercase tracking-wider text-xs border-l-2 border-red-500 pl-3">Victory</div>
                      <p>Standard: First to 5 points. Last Citizen Standing & INTERLINKED: Eliminate all opponent cards.</p>
                    </div>
                  </div>

                  {/* Game Modes */}
                  <div className="border-t border-white/10 pt-6">
                    <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-4">Game Modes</h3>

                    <div className="space-y-4">
                      {/* Omnipresent */}
                      <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-purple-400 font-bold text-sm">🔮 OMNIPRESENT</div>
                          <div className="text-purple-400/60 text-xs">• Standard Mode</div>
                        </div>
                        <p className="text-xs">Full battlefield awareness. All traits visible. Attacker selects trait, defender counters. Numeric traits compare values; string traits compare rarity. First to 5 points wins.</p>
                      </div>

                      {/* Chaotic */}
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-blue-400 font-bold text-sm">⚡ CHAOTIC</div>
                          <div className="text-blue-400/60 text-xs">• Limited Intel</div>
                        </div>
                        <p className="text-xs">Strength is the only visible metric. All other traits hidden. Pure power-based combat. Attacker chooses strength, defender must counter blind. First to 5 points wins.</p>
                      </div>

                      {/* Threat Intelligence */}
                      <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-red-400 font-bold text-sm">🎯 THREAT INTEL</div>
                          <div className="text-red-400/60 text-xs">• Counter-Ops</div>
                        </div>
                        <p className="text-xs">Blind defense mechanism. Defender sees nothing until attack is declared. Attacker has full intel. Defender must counter without information. First to 5 points wins.</p>
                      </div>

                      {/* Last Citizen Standing */}
                      <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-orange-400 font-bold text-sm">💀 LAST CITIZEN</div>
                          <div className="text-orange-400/60 text-xs">• Total Attrition</div>
                        </div>
                        {/* Timer - Top Right Corner */}
                        <div className={`fixed top-8 right-8 z-[100] text-center transition-opacity duration-300 ${isPlayerTurn && !playerBattleCard && !battleResult && !showAngieGraveyard && !isRefreshPhase && !activeSummon ? 'opacity-100' : 'opacity-30'}`}>
                          <div className="text-orange-400 text-sm font-semibold mb-1">TIME</div>
                          <div className="text-5xl font-bold text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.8)]">
                            {timer}
                          </div>
                        </div>                <p className="text-xs">All 6 numeric traits fight simultaneously. Each trait: both sides take damage equal to opponent's value. Cards with 3+ traits at 0 are eliminated. Refresh phase every 10 turns: discard & draw. Last player with cards wins.</p>
                      </div>

                      {/* INTERLINKED */}
                      <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-cyan-400 font-bold text-sm">🔗 INTERLINKED</div>
                          <div className="text-cyan-400/60 text-xs">• Trait-Based Warfare</div>
                        </div>
                        <p className="text-xs">All 12 traits fight simultaneously with score reduction. Each trait: winner keeps difference, loser gets 0. Cards with 6+ traits at 0 are eliminated. Refresh phase every 10 turns: discard & draw with fresh scores. Last player with cards wins.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Shared Top Right Timer & Turn - Stacked */}
        {((gamePhase === 'battle') || ((gamePhase === 'discard' || (isRefreshPhase && !playerRefreshDiscarded)) && validCitizens.length >= 24)) && (
          <div className="fixed top-8 right-8 z-[100] flex flex-col items-end gap-3 pointer-events-none">
            {/* Timer - ONLY VISIBLE ON PLAYER'S TURN BEFORE INITIATE CLASH */}
            {isPlayerTurn && !playerBattleCard && !battleResult && !gameOver && (
              <div className="bg-black/80  border border-white/10 px-5 py-3 rounded-2xl shadow-lg shadow-black/20 min-w-[90px] text-center pointer-events-auto">
                <div className={`text-4xl font-light tracking-tighter leading-none ${timer <= 10 ? 'text-red-500 animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]'}`}>
                  {timer}
                </div>
                <div className="text-[8px] uppercase tracking-widest text-white/30 mt-1 font-bold">Seconds</div>
              </div>
            )}

            {/* Turn Counter (Battle Only) */}
            {(gameMode === 'last-citizen-standing' || gameMode === 'interlinked') && gamePhase === 'battle' && (
              <div className="bg-black/80  border border-white/10 px-4 py-2 rounded-xl shadow-lg flex items-center justify-between gap-4 w-full pointer-events-auto">
                <span className="text-[10px] uppercase tracking-widest text-[#0090ff] font-bold">Turn</span>
                <span className="text-lg font-light text-white tabular-nums leading-none">{turnCount + 1}</span>
              </div>
            )}
          </div>
        )}

        {gameStarted && (gamePhase === 'discard' || isRefreshPhase) && (
          <div className={`fixed inset-0 z-[5] overflow-hidden flex flex-col items-center justify-end ${isRefreshPhase ? 'bg-black' : ''}`}>
            {/* Timer - Top Right Corner - Always Visible */}


            {validCitizens.length < 24 && (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <p className="text-2xl font-bold uppercase tracking-widest text-[#4db8ff] mb-4 animate-pulse">Drawing your 12...</p>
                  <p className="text-lg font-bold uppercase tracking-widest text-purple-300">{validCitizens.length} / 24 loading (need 24 total)</p>
                </div>
              </div>
            )}

            <div className="hidden">
              {citizens.map((card) => (
                <img key={card.id} src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${card.id}.png`} alt="" onLoad={() => handleImageLoad(card.id)} onError={() => handleImageError(card.id)} />
              ))}
            </div>

            {/* Discard Phase UI */}
            {(gamePhase === 'discard' && turnCount === 0 && validCitizens.length >= 24) && (
              <div className="mb-8 w-full max-w-7xl mx-auto px-4">
                {/* Big Gold "Discard 3 Cards" Message - Shows for 2 seconds */}
                {showDiscardMessage && !isRefreshPhase && turnCount === 0 && (
                  <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                    <div className="text-7xl md:text-8xl font-black italic tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] animate-fade-in-out">
                      DISCARD 3 CARDS
                    </div>
                  </div>
                )}

                {/* Refresh Phase Header & New Draw Display */}
                {isRefreshPhase && (
                  <div className="flex flex-col items-center mb-8">
                    <h2 className="text-4xl font-bold text-yellow-400 mb-2">REFRESH PHASE</h2>
                    <p className="text-xl text-blue-300 mb-6">Select a card from your hand to replace with the New Draw</p>

                    {/* New Draw Preview */}
                    {refreshDrawnCard && (
                      <div className="flex flex-col items-center gap-2 animate-in zoom-in duration-500">
                        <div className="text-orange-400 font-bold text-sm uppercase tracking-widest">Incoming Unit</div>
                        <div className="w-32 h-32 bg-gray-900 rounded-xl overflow-hidden border-2 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)] relative group">
                          <img
                            src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${refreshDrawnCard}.png`}
                            alt="New Draw"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 inset-x-0 bg-black/80 py-1 text-center">
                            <span className="text-orange-400 font-bold text-xs">#{refreshDrawnCard}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 transition-opacity duration-500 ${showDiscardMessage ? 'opacity-30' : 'opacity-100'}`}>
                  {(isRefreshPhase ? playerDeck : validCitizens.slice(0, 12).map((c: CitizenCard) => c.id)).map((cardId: number) => {
                    const isDiscarded = isRefreshPhase ? false : discardedCards.includes(cardId)
                    const isSelected = selectedForDiscard === cardId
                    return (
                      <div
                        key={cardId}
                        className={`relative bg-gray-900/70 border rounded-xl overflow-hidden shadow-lg transition-all duration-300 cursor-pointer ${isDiscarded ? 'opacity-30 border-red-600/40' : isSelected ? 'border-yellow-500 shadow-yellow-500/50 scale-105' : 'border-[#0077cc]/40 shadow-[#002244]/30 hover:border-yellow-500 hover:shadow-yellow-500/50 hover:scale-105'
                          }`}
                        onClick={() => !isDiscarded && setSelectedForDiscard(cardId)}
                      >
                        <img src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${cardId}.png`} alt={`Citizen ${cardId}`} className="w-full aspect-square object-cover" />

                        {/* Debuff Flash overlay - Player Wide (-10%) */}
                        {debuffFlashPlayer > 0 && Date.now() - debuffFlashPlayer < 2500 && (
                          <div className="absolute inset-0 z-40 flex items-center justify-center bg-red-600/40 animate-pulse transition-all duration-300 rounded-lg">
                            <div className="text-white text-xl font-black italic shadow-2xl">-10%</div>
                          </div>
                        )}
                        <p className="text-xl font-bold text-cyan-200 text-center py-3">#{cardId}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RPS MINI-GAME - Determines who goes first */}
        {gamePhase === 'rps' && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-8 w-full max-w-2xl px-4">

              {/* Header */}
              <div className="text-center">
                <div className="text-white/40 text-[10px] font-bold uppercase tracking-[0.4em] mb-3">
                  Protocol Initiated
                </div>
                <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  FIRST STRIKE
                </h1>
                <div className="text-[#0090ff] text-sm font-bold uppercase tracking-widest mt-3">
                  {rpsResult === 'tie' ? 'Draw — pick again' : !rpsPlayerChoice ? 'Choose your weapon' : '\u00A0'}
                </div>
              </div>

              {/* Countdown Display */}
              {rpsCountdown !== null && rpsCountdown > 0 && (
                <div className="text-8xl font-black text-yellow-400 animate-pulse drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]">
                  {rpsCountdown}
                </div>
              )}

              {/* Versus Display (after player picks) */}
              {rpsPlayerChoice && (
                <div className="flex items-center justify-center gap-12 md:gap-20 w-full">

                  {/* Player Choice */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-[#0090ff] text-[10px] font-bold uppercase tracking-[0.3em]">You</div>
                    <div className="w-32 h-32 bg-black/80 border border-[#0090ff]/40 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,144,255,0.2)] flex items-center justify-center">
                      <RpsIcon choice={rpsPlayerChoice} size="w-28 h-28" />
                    </div>
                    <div className="text-white font-bold tracking-widest text-sm">{rpsPlayerChoice.toUpperCase()}</div>
                  </div>

                  {/* VS */}
                  <div className="text-white/20 text-4xl font-black italic tracking-tighter">VS</div>

                  {/* AI Choice */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-red-400 text-[10px] font-bold uppercase tracking-[0.3em]">Opponent</div>
                    <div className={`w-32 h-32 bg-black/80 border rounded-2xl flex items-center justify-center transition-all duration-500 ${
                      rpsRevealed ? 'border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                    }`}>
                      {rpsRevealed && rpsAiChoice ? (
                        <RpsIcon choice={rpsAiChoice} size="w-28 h-28" />
                      ) : (
                        <span className="text-5xl animate-pulse">❓</span>
                      )}
                    </div>
                    <div className="text-white/50 font-bold tracking-widest text-sm">
                      {rpsRevealed && rpsAiChoice ? rpsAiChoice.toUpperCase() : '???'}
                    </div>
                  </div>
                </div>
              )}

              {/* Result Banner */}
              {rpsResult && rpsResult !== 'tie' && (
                <div className={`text-center ${rpsResult === 'win' ? 'text-[#0090ff]' : 'text-red-400'}`}>
                  <div className="text-4xl md:text-5xl font-black italic tracking-tighter drop-shadow-[0_0_20px_rgba(0,144,255,0.4)]">
                    {rpsResult === 'win' ? 'YOU STRIKE FIRST' : 'OPPONENT STRIKES FIRST'}
                  </div>
                  <div className="text-white/40 text-xs font-bold uppercase tracking-widest mt-3">
                    Entering combat zone...
                  </div>
                </div>
              )}

              {/* Choice Buttons (only before picking) */}
              {!rpsPlayerChoice && (
                <div className="flex items-center justify-center gap-6 mt-4">
                  {(['rock', 'paper', 'scissors'] as const).map(choice => (
                    <button
                      key={choice}
                      onClick={() => handleRpsChoice(choice)}
                      className="group flex flex-col items-center gap-3 p-6 bg-black/80 border border-white/10 rounded-2xl transition-all duration-300 hover:border-[#0090ff]/60 hover:shadow-[0_0_30px_rgba(0,144,255,0.3)] hover:scale-110 active:scale-95 cursor-pointer"
                    >
                      <div className="group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                        <RpsIcon choice={choice} size="w-24 h-24" />
                      </div>
                      <span className="text-white font-bold tracking-widest text-sm uppercase">{choice}</span>
                    </button>
                  ))}
                </div>
              )}

            </div>
          </div>
        )}

        {selectedForDiscard !== null && (gamePhase === 'discard' || (isRefreshPhase && !playerRefreshDiscarded)) && !discardedCards.includes(selectedForDiscard) && (
          <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50 p-4" onClick={() => !isRefreshPhase && setSelectedForDiscard(null)}>
            {/* Prompt Message for Refresh Phase */}
            {isRefreshPhase && (
              <div className="mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="text-[#0090ff] text-sm font-bold uppercase tracking-[0.3em] mb-2 opacity-70">Refresh Phase</div>
                <div className="text-white text-3xl font-black tracking-tight">
                  Discard a Card and Draw a New One
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-12 w-full max-w-7xl">

              {/* LEFT SIDE: Card Preview Section with Navigation */}
              <div className="flex items-center justify-center gap-6">
                {/* Left Preview Card */}
                {(() => {
                  const availableCards = isRefreshPhase ? playerDeck : validCitizens.slice(0, 12).filter(c => !discardedCards.includes(c.id))
                  const currentIndex = availableCards.findIndex(c => (typeof c === 'number' ? c : (c as any).id) === selectedForDiscard)
                  const prevIndex = currentIndex > 0 ? currentIndex - 1 : availableCards.length - 1
                  const prevCard = availableCards[prevIndex]
                  return (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-[160px] opacity-50 hover:opacity-100 transition-all cursor-pointer hover:scale-105" onClick={(e) => { e.stopPropagation(); setSelectedForDiscard(typeof prevCard === 'number' ? prevCard : (prevCard as any).id); }}>
                        <img src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${typeof prevCard === 'number' ? prevCard : (prevCard as any).id}.png`} alt="Prev Card" className="w-full aspect-square object-cover rounded-xl border-2 border-[#0077cc]" />
                      </div>
                      <div className="text-[#0090ff] text-5xl leading-none select-none opacity-50 hover:opacity-100 cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedForDiscard(typeof prevCard === 'number' ? prevCard : (prevCard as any).id); }}>‹</div>
                    </div>
                  )
                })()}

                {/* Main Centered Card with Traits */}
                <div className="bg-gradient-to-b from-gray-900 to-black border-4 border-[#0077cc] rounded-2xl w-full max-w-[320px] overflow-hidden shadow-2xl shadow-[#0055aa]/70 relative" onClick={(e) => e.stopPropagation()}>
                  {!isRefreshPhase && <button className="absolute top-2 right-3 text-[#4db8ff] text-2xl hover:text-white z-10 transition-colors" onClick={() => setSelectedForDiscard(null)}>×</button>}
                  <h3 className="text-sm font-bold text-[#4db8ff] text-center pt-2 pb-1">Citizen #{selectedForDiscard}</h3>
                  <div className="w-full aspect-square bg-black flex items-center justify-center border-b-4 border-[#0055aa]/50">
                    <img src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${selectedForDiscard}.png`} alt={`Citizen #${selectedForDiscard}`} className="w-full h-full object-contain" />
                  </div>
                  <div className="p-4 space-y-2">
                    {(() => {
                      const traits = citizenTraits[selectedForDiscard!]
                      if (!traits) return <div className="text-white/50 text-center">Loading traits...</div>

                      // Only show numeric traits for Last Citizen Standing mode
                      if (gameMode === 'last-citizen-standing') {
                        return (
                          <>
                            {[
                              { name: 'Strength', value: traits.strength },
                              { name: 'Intelligence', value: traits.intelligence },
                              { name: 'Cool', value: traits.cool },
                              { name: 'Tech Skill', value: traits.techSkill },
                              { name: 'Attractiveness', value: traits.attractiveness },
                              { name: 'Reward', value: parseFloat(traits.rewardRate) || 0 }
                            ].map((trait, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-[#4db8ff] font-semibold uppercase tracking-wide text-xs">{trait.name}</span>
                                <span className="text-white font-bold tabular-nums">{trait.value}</span>
                              </div>
                            ))}
                          </>
                        )
                      }

                      // For INTERLINKED mode, show trait values in 3×4 grid (same as selected card view)
                      if (gameMode === 'interlinked') {
                        const availableTraits = getAvailableTraits()

                        return (
                          <div className="grid grid-cols-3 gap-1 text-center">
                            {availableTraits.map(({ label, value: traitKey, key }) => {
                              const value = traits[traitKey as keyof CitizenTraits]
                              return (
                                <div key={label} className="bg-gray-800/70 border border-[#0055aa]/40 rounded p-1 h-[45px] flex flex-col justify-center opacity-90 transition-all">
                                  <div className="text-[#0090ff] font-semibold leading-tight text-[8px] tracking-tighter uppercase">{label}</div>
                                  <div className={`text-[11px] font-bold leading-tight overflow-hidden text-ellipsis line-clamp-2 ${isUltraRareTrait(key, value) ? 'text-yellow-400' : isRareTrait(key, value) ? 'text-purple-300' : 'text-white/90'}`}>
                                    {value}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      }

                      return null
                    })()}
                  </div>
                </div>

                {/* Right Preview Card */}
                {(() => {
                  const availableCards = isRefreshPhase ? playerDeck : validCitizens.slice(0, 12).filter(c => !discardedCards.includes(c.id))
                  const currentIndex = availableCards.findIndex(c => (typeof c === 'number' ? c : (c as any).id) === selectedForDiscard)
                  const nextIndex = currentIndex < availableCards.length - 1 ? currentIndex + 1 : 0
                  const nextCard = availableCards[nextIndex]
                  return (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-[160px] opacity-50 hover:opacity-100 transition-all cursor-pointer hover:scale-105" onClick={(e) => { e.stopPropagation(); setSelectedForDiscard(typeof nextCard === 'number' ? nextCard : (nextCard as any).id); }}>
                        <img src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${typeof nextCard === 'number' ? nextCard : (nextCard as any).id}.png`} alt="Next Card" className="w-full aspect-square object-cover rounded-xl border-2 border-[#0077cc]" />
                      </div>
                      <div className="text-[#0090ff] text-5xl leading-none select-none opacity-50 hover:opacity-100 cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedForDiscard(typeof nextCard === 'number' ? nextCard : (nextCard as any).id); }}>›</div>
                    </div>
                  )
                })()}
              </div>

              {/* CENTER: Discard Button & Counter */}
              <div className="flex flex-col items-center gap-6">
                <button
                  className="btn-premium-red px-8 py-4 text-3xl font-bold text-white rounded-xl transition-all"
                  onClick={(e) => { e.stopPropagation(); handleDiscard(); }}
                >
                  {isRefreshPhase ? 'DISCARD' : 'DISCARD'}
                </button>
                <div className="text-2xl font-bold text-[#4db8ff]">[{isRefreshPhase ? '0/1' : `${discardedCards.length}/3`}]</div>
              </div>

              {/* RIGHT SIDE: New Draw Card (Refresh Phase Only) */}
              {isRefreshPhase && refreshDrawnCard && (
                <div className="flex flex-col items-center gap-4">
                  <div className="text-orange-400 font-bold text-xl uppercase tracking-widest animate-pulse">New Draw</div>
                  <div className="w-[320px] bg-gradient-to-b from-gray-900 to-black border-4 border-orange-500 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="w-full aspect-square bg-black flex items-center justify-center">
                      <img src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${refreshDrawnCard}.png`} alt="New Card" className="w-full h-full object-contain" />
                    </div>
                    <div className="text-center py-3 text-white font-bold text-lg">#{refreshDrawnCard}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {gamePhase === 'battle' && (
          <div className="fixed inset-0 flex flex-col">
            {/* Phase 12: Persistent Card Loader - Always active for new cards */}
            <div className="hidden">
              {citizens.map((card) => (
                <img key={card.id} src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${card.id}.png`} alt="" onLoad={() => handleImageLoad(card.id)} onError={() => handleImageError(card.id)} />
              ))}
            </div>

            {/* Battle Background - Battlefield Image */}
            <div
              className="absolute inset-0 bg-no-repeat bg-cover z-0"
              style={{
                backgroundImage: "url('https://raw.githubusercontent.com/badfuture-926/neo-tokyo-card-clash/main/Battlefield.png')",
                backgroundPosition: "center center",
                transform: "translateZ(0)",
              }}
            />
            {/* Dark overlay for better visibility */}
            <div className="absolute inset-0 bg-black/80 z-0" />
            {/* Removed Legacy Refresh Modal */}
            {/* Integrated Scoreboard & Turn Counter - Top Left */}
            {/* Unified Battle HUD - Top Center */}
            {/* Minimalist Top Left Score - Stacked & Labelled with Game Colors */}
            <div className="fixed top-8 left-8 z-[100] flex flex-col gap-2 bg-black/80  border border-white/10 px-5 py-4 rounded-2xl shadow-lg shadow-black/20 hover:bg-black/50 transition-all duration-500 cursor-default min-w-[140px]">
              {/* Player Row */}
              <div className="flex items-center justify-between gap-6 border-b border-white/10 pb-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#0090ff] font-bold drop-shadow-[0_0_8px_rgba(0,144,255,0.5)]">You</span>
                <span className="text-3xl font-light text-white tabular-nums tracking-tighter leading-none filter drop-shadow-[0_0_8px_rgba(0,144,255,0.3)]">{playerScore}</span>
              </div>
              {/* Opponent Row */}
              <div className="flex items-center justify-between gap-6 pt-1">
                <span className="text-[10px] uppercase tracking-[0.2em] text-red-500 font-bold drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">Opp</span>
                <span className="text-3xl font-light text-white/90 tabular-nums tracking-tighter leading-none filter drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]">{opponentScore}</span>
              </div>
            </div>



            {/* Opponent deck - top */}
            <div className="flex justify-center items-center gap-2 p-4 bg-gradient-to-b from-black/80 to-transparent relative z-20">
              {/* Board overlay during targeting (except for Angelic Overlord) */}
              {isTargeting && activeSummon !== 'angelic' && (
                <div className="absolute inset-0 bg-black/85 z-[25] pointer-events-none transition-opacity duration-500 rounded-b-3xl" />
              )}
              {opponentDeck.map((cardId: number) => (
                <div
                  key={cardId}
                  ref={el => opponentDeckRefs.current[Number(cardId)] = el}
                  className={`relative w-32 bg-gray-900/70 border-4 rounded-lg overflow-hidden shadow-lg transition-all duration-300 ${
                    opponentActiveSummon === 'angelic-overlord' && opponentSummonTarget === cardId ? 'ring-4 ring-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.8)] opacity-100 scale-105' :
                    resurrectCardHighlight === Number(cardId) ? 'ring-4 ring-green-400 shadow-[0_0_30px_rgba(74,222,128,0.8)]' : ''
                    } ${isTargeting && activeSummon !== 'angelic' ? 'cursor-pointer border-white/40 opacity-100 hover:border-red-500 hover:ring-4 hover:ring-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.8)] z-30' : 'border-red-600/20 opacity-40'
                    }`}
                  onClick={() => {
                    if (isTargeting && activeSummon !== 'angelic') {
                      if (activeSummon === 'darklord') {
                        applyDarkLordEffect(Number(cardId));
                      } else {
                        // Player chose their target! Open inspection modal.
                        setPendingTarget(cardId)
                      }
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (isTargeting && activeSummon !== 'angelic') {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setHoveredTargetRect({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
                      setHoveredTarget(cardId)
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredTargetRect(null)
                    setHoveredTarget(null)
                  }}
                >
                  <img src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${cardId}.png`} alt={`Opponent ${cardId}`} className="w-full aspect-square object-cover opacity-80" />

                  {/* Debuff Flash overlay - Target (-50%) */}
                  {debuffFlashTarget === Number(cardId) && (
                    <div className="absolute inset-0 z-40 flex items-center justify-center bg-red-600/60 animate-pulse transition-all duration-300">
                      <div className="text-white text-3xl font-black italic shadow-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">-50%</div>
                    </div>
                  )}
                  {/* Buff Flash overlay - Opponent Wide (+10%) */}
                  {buffFlashOpponent > 0 && Date.now() - buffFlashOpponent < 2500 && (
                    <div className="absolute inset-0 z-40 flex items-center justify-center bg-green-500/40 animate-pulse transition-all duration-300">
                      <div className="text-white text-xl font-black italic shadow-2xl">+10%</div>
                    </div>
                  )}

                  {/* Individual Summon Flash Effects */}
                  {cardFlashEffects[Number(cardId)] && (
                    <div className={`absolute inset-0 z-[60] flex items-center justify-center animate-flash-text pointer-events-none bg-${cardFlashEffects[Number(cardId)].color}-500/20`}>
                      <div className={`text-${cardFlashEffects[Number(cardId)].color}-400 text-3xl font-black italic drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]`}>
                        {cardFlashEffects[Number(cardId)].text}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Battle area - middle grid */}
            <div className="flex-1 relative z-10 grid grid-cols-12 px-12">

              {/* Left Column: Targeting Prompt, Operational Phase, Special Abilities */}
              <div className="col-span-3 flex flex-col items-start justify-center gap-8 pl-8 h-full">


                {isTargeting && !pendingTarget && isPlayerTurn && (
                  <div className="fixed top-1/2 left-8 -translate-y-1/2 z-[50] bg-gray-900/90 border border-red-500/50  rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-left-4 duration-500 w-[240px]">
                    <div className="text-center">
                      <div className={`text-[10px] font-black mb-2 uppercase tracking-widest opacity-70 ${activeSummon === 'angelic' ? 'text-blue-400' : 'text-red-400'}`}>Action Required</div>
                      {activeSummon === 'angelic' ? (
                        <>
                          <div className="text-3xl font-black text-white leading-none tracking-tighter">CHOOSE<br /><span className="text-blue-500">ALLY</span></div>
                          <div className="text-[10px] font-bold mt-3 text-blue-300/60 leading-tight">Select a friendly unit to bless (+50%)</div>
                        </>
                      ) : (
                        <>
                          <div className="text-3xl font-black text-white leading-none tracking-tighter">CHOOSE<br /><span className="text-red-500">TARGET</span></div>
                          <div className="text-[10px] font-bold mt-3 text-red-300/60 leading-tight">Identify the hostile citizen to rain down fire upon</div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Special Abilities - Left Side Stack */}
                <div className={`flex flex-col gap-4 ${isTargeting ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300`}>
                  {/* Buttons moved to center */}
                </div>
              </div>

              {/* Center Column: The Clash */}
              <div className="col-span-6 flex items-center justify-center gap-8 relative">
                {/* Battlefield Cards Container - Always Vertically Centered */}
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-8 z-[40]">

                  {/* Your Card slot */}
                  <div id="player-battle-card" className="w-[280px] h-[340px] border border-[#0090ff]/20 bg-[#001122]/5 rounded-2xl flex items-center justify-center p-1.5 relative group flex-shrink-0">
                    {(playerBattleCard || (isPlayerTurn && selectedBattleCard)) ? (
                      <div className="relative border border-[#0090ff]/50 rounded-xl w-full h-full overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.15)] transition-all duration-500">
                        <img
                          src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${playerBattleCard || selectedBattleCard}.png`}
                          alt="Your Card"
                          className="w-full h-full object-cover"
                        />
                        {/* Card number overlay */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                          <span className="text-[#0090ff] font-black text-lg tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.0.8)]">#{playerBattleCard || selectedBattleCard}</span>
                        </div>

                        {(gameMode === 'last-citizen-standing' || gameMode === 'interlinked') && isTargeting && !pendingTarget && isPlayerTurn && (
                          <div className="absolute inset-0 bg-black/85 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center  cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); setPlayerBattleCard(null); setSelectedBattleCard(null); setIsTargeting(false); }}
                          >
                            <span className="text-white font-black text-xs tracking-widest bg-red-600 px-4 py-2 rounded-full shadow-lg">RETRACT</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#0090ff]/20 font-black text-sm tracking-widest uppercase italic">Deploy Asset</span>
                    )}
                  </div>

                  {/* VS - Calm Presence */}
                  {!showBattleAnimation && !battleResult && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-black text-white/10 italic tracking-tighter select-none z-0">VS</div>
                  )}

                  {/* Opponent's Card slot */}
                  <div
                    id="opponent-battle-card"
                    className="w-[280px] h-[340px] border border-red-500/20 bg-red-950/5 rounded-2xl flex items-center justify-center p-1.5 relative flex-shrink-0"
                  >
                    {opponentBattleCard ? (
                      <div className="relative border border-red-500/50 rounded-xl w-full h-full overflow-hidden shadow-[0_0_40px_rgba(220,38,38,0.15)] transition-all duration-500">
                        <img
                          src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${opponentBattleCard}.png`}
                          alt="Opponent Card"
                          className="w-full h-full object-cover"
                        />
                        {/* Card number overlay */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                          <span className="text-red-500 font-black text-lg tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">#{opponentBattleCard}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-red-500/20 font-black text-sm tracking-widest uppercase italic">Hostile Zone</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Operational Phase */}
            {!gameOver && <div className="fixed top-1/2 right-8 -translate-y-1/2 z-[50]">
              <div className={`bg-gray-900/90  border rounded-2xl p-6 shadow-2xl transition-all duration-500 min-w-[200px] ${isPlayerTurn ? 'border-[#0090ff]/50' : 'border-red-500/50'}`}>
                <div className="text-center">
                  <div className={`text-[10px] font-black mb-2 uppercase tracking-widest opacity-70 ${isPlayerTurn ? 'text-[#0090ff]' : 'text-red-400'}`}>
                    Operational Phase
                  </div>
                  <div className="text-3xl font-black tracking-tighter text-white">
                    {isPlayerTurn ? 'YOUR TURN' : 'AI ACTIVE'}
                  </div>
                  <div className={`text-[10px] font-bold mt-3 leading-tight opacity-50 ${isPlayerTurn ? 'text-cyan-200' : 'text-red-200'}`}>
                    {isPlayerTurn ? 'Analyze and Neutralize Target' : 'Tactical Countermeasures...'}
                  </div>
                </div>
              </div>
            </div>}

            {/* Overlays: Absolute within Grid Container */}
            {battleLog && (
              <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/95 animate-in fade-in duration-300" onClick={handleReportClose}>
                <div className="relative w-full max-w-7xl mx-4 bg-[#050505] border border-white/10 rounded-[2rem] shadow-2xl p-10 flex flex-col items-center max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>

                  {/* Header */}
                  <div className="text-center mb-6 shrink-0">
                    <div className="text-white/40 text-[10px] font-bold uppercase tracking-[0.4em] mb-2">Engagement Analysis</div>
                    <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter">BATTLE REPORT</h2>
                  </div>

                  {/* Main Content Info */}
                  <div className="flex flex-col md:flex-row items-center justify-center w-full gap-8 md:gap-16 grow overflow-hidden">

                    {/* LEFT SIDE: Player Card */}
                    <div className="hidden md:flex flex-col items-center shrink-0">
                      <div className="w-48 h-64 bg-gray-900 rounded-2xl overflow-hidden shadow-[0_0_30px_-5px_rgba(0,144,255,0.3)] ring-1 ring-[#0090ff]/30 relative mb-4">
                        <img
                          src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${reportPlayerCard}.png`}
                          alt="Player"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-8 text-center">
                          <div className="text-[#0090ff] font-bold text-lg tracking-widest">#{reportPlayerCard}</div>
                        </div>
                      </div>
                      <div className="text-[#0090ff] text-xs font-bold tracking-widest uppercase">You</div>
                    </div>

                    {/* CENTER: Battle Log Grid */}
                    <div className="flex-1 w-full max-w-3xl overflow-y-auto pr-2 custom-scrollbar pb-24">
                      {/* Grid Header */}
                      <div className="grid grid-cols-5 gap-4 text-[9px] uppercase tracking-widest font-bold text-white/30 border-b border-white/10 pb-2 mb-2 sticky top-0 bg-[#050505] z-10">
                        <div className="text-right text-[#0090ff]">Trait</div>
                        <div className="text-right text-cyan-100/50">Value</div>
                        <div className="text-center text-white/50">Outcome</div>
                        <div className="text-left text-red-100/50">Value</div>
                        <div className="text-left text-red-500">Trait</div>
                      </div>

                      {/* Grid Rows */}
                      <div className="space-y-1">
                        {battleLog.map((log, i) => (
                          <div key={i} className="grid grid-cols-5 gap-4 items-center py-1 border-b border-white/5 hover:bg-white/5 transition-colors group">
                            {/* Col 1: Player Trait Label */}
                            <div className={`text-right text-[10px] font-bold uppercase tracking-wider ${log.winner === 'player' ? 'text-[#0090ff]' : 'text-white/40'}`}>
                              {log.trait}
                            </div>

                            {/* Col 2: Player Value */}
                            <div className={`text-right font-medium tabular-nums text-sm truncate ${log.winner === 'player' ? 'text-white' : 'text-white/30'}`}>
                              {log.pVal}
                            </div>

                            {/* Col 3: Outcome (Text) */}
                            <div className="text-center flex justify-center items-center">
                              {log.winner === 'player' && <span className="text-[#0090ff] text-[10px] font-black uppercase tracking-widest bg-[#0090ff]/10 px-2 py-1 rounded">BEATS</span>}
                              {log.winner === 'opponent' && <span className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-500/10 px-2 py-1 rounded">LOSES TO</span>}
                              {log.winner === 'tie' && <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest">TIES</span>}
                            </div>

                            {/* Col 4: Opponent Value */}
                            <div className={`text-left font-medium tabular-nums text-sm truncate ${log.winner === 'opponent' ? 'text-white' : 'text-white/30'}`}>
                              {log.oVal}
                            </div>

                            {/* Col 5: Opponent Trait Label */}
                            <div className={`text-left text-[10px] font-bold uppercase tracking-wider ${log.winner === 'opponent' ? 'text-red-500' : 'text-white/40'}`}>
                              {log.trait}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* RIGHT SIDE: Opponent Card */}
                    <div className="hidden md:flex flex-col items-center shrink-0">
                      <div className="w-48 h-64 bg-gray-900 rounded-2xl overflow-hidden shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)] ring-1 ring-red-500/30 relative mb-4">
                        <img
                          src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${reportOpponentCard}.png`}
                          alt="Opponent"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-8 text-center">
                          <div className="text-red-400 font-bold text-lg tracking-widest">#{reportOpponentCard}</div>
                        </div>
                      </div>
                      <div className="text-red-400 text-xs font-bold tracking-widest uppercase">Enemy</div>
                    </div>

                  </div>

                  <div className="w-full max-w-md mt-6 shrink-0 text-center">
                    <button
                      onClick={handleReportClose}
                      className="w-full bg-white text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-gray-200 transition-colors relative overflow-hidden group shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                    >
                      <span className="relative z-10 group-hover:scale-105 transition-transform inline-block">CLOSE REPORT</span>
                      <div
                        className="absolute inset-0 bg-gray-300 z-0 transition-none ease-linear origin-left opacity-30"
                        style={{ width: `${(reportTimer / 10) * 100}%`, transition: 'width 1s linear' }}
                      />
                    </button>
                    {reportTimer > 0 && (
                      <div className="text-gray-400 text-sm mt-2 animate-in fade-in duration-300">
                        Report auto-closes in {reportTimer} seconds
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {showBattleAnimation && (
              <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
                <div className="text-7xl font-black text-white italic tracking-tighter animate-clash-vibrate drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                  CLASH<span className="text-yellow-400">!</span>
                </div>
              </div>
            )}

            {battleResult && (
              <div className="absolute inset-0 z-[100] flex items-center justify-center  pointer-events-none">
                <div className={`px-12 py-10 rounded-[2rem] border shadow-2xl animate-in zoom-in duration-300  ${
                  battleResult.winner === 'player' ? 'bg-black/85 border-[#0090ff]/30 shadow-[#0090ff]/10' :
                  battleResult.winner === 'tie' ? 'bg-black/85 border-yellow-500/30 shadow-yellow-500/10' :
                  'bg-black/85 border-red-500/30 shadow-red-500/10'
                }`}>
                  <div className="text-center">
                    <div className={`text-[10px] font-bold uppercase tracking-[0.4em] mb-3 ${
                      battleResult.winner === 'player' ? 'text-[#0090ff]' :
                      battleResult.winner === 'tie' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>engagement outcome</div>
                    <div className="text-4xl md:text-5xl font-black text-white italic tracking-tighter mb-4 drop-shadow-lg">
                      {battleResult.winner === 'tie' ? 'STALEMATE' :
                       battleResult.winner === 'player'
                         ? (battleResult.eliminated ? (isPlayerTurn ? 'TARGET ELIMINATED' : 'HOSTILE NEUTRALIZED') : 'TRAIT VICTORY')
                         : (battleResult.eliminated ? 'UNIT LOST' : 'TRAIT DEFEAT')}
                    </div>
                    <div className="text-white/60 font-medium text-sm max-w-xs mx-auto tracking-wide">{battleResult.message}</div>
                  </div>
                </div>
              </div>
            )}

            {/* CONFLICT MODAL - Steve Jobs Minimalist Redesign */}
            {pendingTarget && (playerBattleCard || selectedBattleCard || opponentBattleCard) && !battleResult && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90  animate-in fade-in duration-300">
                <div className="relative w-full max-w-7xl mx-4 bg-[#050505] border border-white/10 rounded-[2rem] shadow-2xl p-10 flex flex-col items-center">

                  {/* Header: Minimalist & Clean */}
                  <div className="text-center mb-10">
                    <div className="text-white/40 text-[10px] font-bold uppercase tracking-[0.4em] mb-3">Conflict Initiated</div>
                    <div className="text-4xl md:text-5xl font-black text-white italic tracking-tighter mb-2">
                      {isPlayerTurn ? 'CONFIRM ATTACK' : 'INCOMING ATTACK'}
                    </div>
                    {!isPlayerTurn && (
                      <div className="text-red-400/80 text-sm font-medium tracking-wide">Opponent is targeting your citizen</div>
                    )}
                  </div>

                  {/* INTERLINKED MODE: Use side-by-side display instead of top grid */}

                  {/* Main Interaction Area: Wide Landscape Grid */}
                  <div className="flex flex-col md:flex-row items-center justify-center w-full gap-8 md:gap-16">

                    {/* LEFT SIDE: ATTACKER */}
                    {/* Layout: [Card] [Traits] */}
                    <div className="flex flex-row items-center gap-8">
                      {/* Card Display */}
                      <div className="flex flex-col items-center">
                        <div className={`w-56 h-72 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 relative group
                            ${isPlayerTurn ? 'shadow-[0_20px_60px_-15px_rgba(0,144,255,0.3)] ring-1 ring-white/10' : 'shadow-[0_20px_60px_-15px_rgba(239,68,68,0.3)] ring-1 ring-red-500/20'}`}>
                          <img
                            src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${isPlayerTurn ? (playerBattleCard || selectedBattleCard) : opponentBattleCard}.png`}
                            alt="Attacker"
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                            <div className={`text-center font-bold text-lg tracking-widest ${isPlayerTurn ? 'text-[#0090ff]' : 'text-red-400'}`}>
                              #{isPlayerTurn ? (playerBattleCard || selectedBattleCard) : opponentBattleCard}
                            </div>
                          </div>
                        </div>
                        <div className={`mt-4 text-xs font-bold tracking-widest uppercase ${isPlayerTurn ? 'text-[#0090ff]' : 'text-red-400'}`}>
                          {isPlayerTurn ? 'Attacker' : 'Enemy'}
                        </div>
                      </div>

                      {/* Traits Panel (Right of Card) */}
                      <div className="w-56 space-y-2">
                        {gameMode === 'interlinked' ? (
                          <>
                            {(() => {
                              const traits: Array<{ key: keyof CardTraitScores, label: string }> = [
                                { key: 'race', label: 'Race' },
                                { key: 'class', label: 'Class' },
                                { key: 'eyes', label: 'Eyes' },
                                { key: 'ability', label: 'Ability' },
                                { key: 'additionalItem', label: 'Item' },
                                { key: 'helm', label: 'Helm' },
                                { key: 'location', label: 'Location' },
                                { key: 'vehicle', label: 'Vehicle' },
                                { key: 'apparel', label: 'Apparel' },
                                { key: 'rewardRate', label: 'Reward' },
                                { key: 'weapon', label: 'Weapon' },
                                { key: 'strength', label: 'Strength' }
                              ]

                              // Get scores for reliable rendering logic if needed, but primarily we just want to list values first
                              const cardId = isPlayerTurn ? (playerBattleCard || selectedBattleCard)! : opponentBattleCard!
                              const pTraits = citizenTraits[cardId]
                              let pScores = cardTraitScores[cardId]
                              if (!pScores && pTraits) pScores = getInitialTraitScores(cardId)

                              if (!pTraits) return <div className="text-white/20 text-sm">Loading...</div>

                              const originalScores = pTraits ? getInitialTraitScores(cardId, pTraits) : null

                              return traits.map((stat) => {
                                const traitKey = stat.key as keyof CardTraitScores
                                const traitValue = pTraits[traitKey as keyof CitizenTraits]
                                const currentScore = pScores ? pScores[traitKey] : 0
                                const originalScore = originalScores ? originalScores[traitKey] : 0
                                const isReduced = currentScore < originalScore

                                return (
                                  <div key={stat.key} className="flex justify-between items-center group h-5">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isPlayerTurn ? 'text-[#0090ff]' : 'text-red-400'}`}>{stat.label}</span>
                                    <span className={`text-xs font-bold tabular-nums text-right truncate max-w-[100px] ${isReduced ? 'text-orange-400' : 'text-white'}`} title={String(traitValue)}>
                                      {isReduced ? `${traitValue} [${currentScore}]` : traitValue}
                                    </span>
                                  </div>
                                )
                              })
                            })()}
                          </>
                        ) : (
                          // Standard Mode Traits
                          citizenTraits[isPlayerTurn ? (playerBattleCard || selectedBattleCard)! : opponentBattleCard!] ? (
                            <>
                              {[
                                { label: 'Strength', val: citizenTraits[isPlayerTurn ? (playerBattleCard || selectedBattleCard)! : opponentBattleCard!].strength },
                                { label: 'Intelligence', val: citizenTraits[isPlayerTurn ? (playerBattleCard || selectedBattleCard)! : opponentBattleCard!].intelligence },
                                { label: 'Cool', val: citizenTraits[isPlayerTurn ? (playerBattleCard || selectedBattleCard)! : opponentBattleCard!].cool },
                                { label: 'Tech Skill', val: citizenTraits[isPlayerTurn ? (playerBattleCard || selectedBattleCard)! : opponentBattleCard!].techSkill },
                                { label: 'Attractiveness', val: citizenTraits[isPlayerTurn ? (playerBattleCard || selectedBattleCard)! : opponentBattleCard!].attractiveness },
                              ].map((stat) => (
                                <div key={stat.label} className="flex justify-between items-center group">
                                  <span className="text-white/40 text-sm font-medium group-hover:text-white/70 transition-colors">{stat.label}</span>
                                  <span className="text-white text-lg font-light tabular-nums">{stat.val}</span>
                                </div>
                              ))}

                              <div className="h-px bg-white/10 my-4" />

                              <div className="flex justify-between items-center">
                                <span className={`text-sm font-bold uppercase tracking-wider ${isPlayerTurn ? 'text-[#0090ff]' : 'text-red-400'}`}>Reward</span>
                                <span className={`text-xl font-bold tabular-nums ${isPlayerTurn ? 'text-[#0090ff]' : 'text-red-400'}`}>
                                  {citizenTraits[isPlayerTurn ? (playerBattleCard || selectedBattleCard)! : opponentBattleCard!].rewardRate || '-'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center mt-1 opacity-60">
                                <span className="text-xs uppercase tracking-wider text-white/40">Total Power</span>
                                <span className="text-sm font-medium text-white/60 tabular-nums">
                                  {(citizenTraits[isPlayerTurn ? (playerBattleCard || selectedBattleCard)! : opponentBattleCard!].strength || 0) +
                                    (citizenTraits[isPlayerTurn ? (playerBattleCard || selectedBattleCard)! : opponentBattleCard!].intelligence || 0) +
                                    (citizenTraits[isPlayerTurn ? (playerBattleCard || selectedBattleCard)! : opponentBattleCard!].cool || 0) +
                                    (citizenTraits[isPlayerTurn ? (playerBattleCard || selectedBattleCard)! : opponentBattleCard!].techSkill || 0) +
                                    (citizenTraits[isPlayerTurn ? (playerBattleCard || selectedBattleCard)! : opponentBattleCard!].attractiveness || 0)}
                                </span>
                              </div>
                            </>

                          ) : (
                            <div className="text-white/20 text-sm">Loading data...</div>
                          )
                        )}
                      </div>
                    </div>

                    {/* CENTER: VS DIVIDER */}
                    <div className="hidden md:flex flex-col items-center h-48 w-px bg-white/10 relative mx-4">
                      <div className="absolute top-1/2 -translate-y-1/2 bg-[#050505] py-4 text-white/20 font-serif italic text-2xl">vs</div>
                    </div>

                    {/* RIGHT SIDE: DEFENDER */}
                    {/* Layout: [Traits] [Card] (Mirrored) */}
                    <div className="flex flex-row items-center gap-8">
                      {/* Traits Panel (Left of Card) */}
                      <div className="w-56 space-y-2 text-right">
                        {gameMode === 'interlinked' ? (
                          <>
                            {(() => {
                              const traits: Array<{ key: keyof CardTraitScores, label: string }> = [
                                { key: 'race', label: 'Race' },
                                { key: 'class', label: 'Class' },
                                { key: 'eyes', label: 'Eyes' },
                                { key: 'ability', label: 'Ability' },
                                { key: 'additionalItem', label: 'Item' },
                                { key: 'helm', label: 'Helm' },
                                { key: 'location', label: 'Location' },
                                { key: 'vehicle', label: 'Vehicle' },
                                { key: 'apparel', label: 'Apparel' },
                                { key: 'rewardRate', label: 'Reward' },
                                { key: 'weapon', label: 'Weapon' },
                                { key: 'strength', label: 'Strength' }
                              ]

                              // Use pendingTarget for traits, as we are confirming attack
                              const cardId = pendingTarget!
                              const oTraits = citizenTraits[cardId]
                              let oScores = cardTraitScores[cardId]
                              if (!oScores && oTraits) oScores = getInitialTraitScores(cardId)

                              if (!oTraits) return <div className="text-white/20 text-sm">Loading...</div>

                              const originalScores = oTraits ? getInitialTraitScores(cardId, oTraits) : null

                              return traits.map((stat) => {
                                const traitKey = stat.key as keyof CardTraitScores
                                const traitValue = oTraits[traitKey as keyof CitizenTraits]
                                const currentScore = oScores ? oScores[traitKey] : 0
                                const originalScore = originalScores ? originalScores[traitKey] : 0
                                const isReduced = currentScore < originalScore

                                return (
                                  <div key={stat.key} className="flex justify-between items-center flex-row-reverse group h-5">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isPlayerTurn ? 'text-red-400' : 'text-[#0090ff]'}`}>{stat.label}</span>
                                    <span className={`text-xs font-bold tabular-nums truncate max-w-[100px] ${isReduced ? 'text-orange-400' : 'text-white'}`} title={String(traitValue)}>
                                      {isReduced ? `${traitValue} [${currentScore}]` : traitValue}
                                    </span>
                                  </div>
                                )
                              })
                            })()}
                          </>
                        ) : (
                          // Standard LCS Mode Traits
                          citizenTraits[pendingTarget] ? (
                            <>
                              {[
                                { label: 'Strength', val: citizenTraits[pendingTarget].strength },
                                { label: 'Intelligence', val: citizenTraits[pendingTarget].intelligence },
                                { label: 'Cool', val: citizenTraits[pendingTarget].cool },
                                { label: 'Tech Skill', val: citizenTraits[pendingTarget].techSkill },
                                { label: 'Attractiveness', val: citizenTraits[pendingTarget].attractiveness },
                              ].map((stat) => (
                                <div key={stat.label} className="flex justify-between items-center flex-row-reverse group">
                                  <span className="text-white/40 text-sm font-medium group-hover:text-white/70 transition-colors">{stat.label}</span>
                                  <span className="text-white text-lg font-light tabular-nums">{stat.val}</span>
                                </div>
                              ))}

                              <div className="h-px bg-white/10 my-4" />

                              <div className="flex justify-between items-center flex-row-reverse">
                                <span className={`text-sm font-bold uppercase tracking-wider ${isPlayerTurn ? 'text-red-400' : 'text-[#0090ff]'}`}>Reward</span>
                                <span className={`text-xl font-bold tabular-nums ${isPlayerTurn ? 'text-red-400' : 'text-[#0090ff]'}`}>
                                  {citizenTraits[pendingTarget].rewardRate || '-'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center flex-row-reverse mt-1 opacity-60">
                                <span className="text-xs uppercase tracking-wider text-white/40">Total Power</span>
                                <span className="text-sm font-medium text-white/60 tabular-nums">
                                  {(citizenTraits[pendingTarget].strength || 0) +
                                    (citizenTraits[pendingTarget].intelligence || 0) +
                                    (citizenTraits[pendingTarget].cool || 0) +
                                    (citizenTraits[pendingTarget].techSkill || 0) +
                                    (citizenTraits[pendingTarget].attractiveness || 0)}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="text-white/20 text-sm">Loading data...</div>
                          )
                        )}
                      </div>

                      {/* Card Display */}
                      <div className="flex flex-col items-center gap-4">
                        <div className={`w-56 h-72 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 relative group
                              ${isPlayerTurn ? 'shadow-[0_20px_60px_-15px_rgba(239,68,68,0.3)] ring-1 ring-red-500/20' : 'shadow-[0_20px_60px_-15px_rgba(0,144,255,0.3)] ring-1 ring-white/10'}`}>
                          <img
                            src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${pendingTarget}.png`}
                            alt="Target"
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                            <div className={`text-center font-bold text-lg tracking-widest ${isPlayerTurn ? 'text-red-400' : 'text-[#0090ff]'}`}>
                              #{pendingTarget}
                            </div>
                          </div>
                        </div>

                        <div className={`text-xs font-bold tracking-widest uppercase ${isPlayerTurn ? 'text-red-400' : 'text-[#0090ff]'}`}>
                          {isPlayerTurn ? 'Target' : 'Defender'}
                        </div>

                        {/* Navigation Arrows - Moved Below Card */}
                        {isPlayerTurn && (
                          <div className="flex items-center gap-8 mt-2">
                            <button
                              className="text-red-500 text-5xl hover:text-red-400 hover:scale-110 transition-all font-bold opacity-70 hover:opacity-100 leading-none pb-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentIndex = opponentDeck.findIndex(id => id === pendingTarget);
                                const prevIndex = currentIndex > 0 ? currentIndex - 1 : opponentDeck.length - 1;
                                setPendingTarget(opponentDeck[prevIndex]);
                              }}
                            >
                              ‹
                            </button>
                            <button
                              className="text-red-500 text-5xl hover:text-red-400 hover:scale-110 transition-all font-bold opacity-70 hover:opacity-100 leading-none pb-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentIndex = opponentDeck.findIndex(id => id === pendingTarget);
                                const nextIndex = currentIndex < opponentDeck.length - 1 ? currentIndex + 1 : 0;
                                setPendingTarget(opponentDeck[nextIndex]);
                              }}
                            >
                              ›
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-12">
                    {isPlayerTurn ? (
                      <div className="flex items-center gap-6">
                        <button
                          className="px-10 py-4 bg-white text-black text-sm font-black uppercase tracking-[0.2em] rounded-full hover:bg-gray-200 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95"
                          onClick={() => {
                            if (!selectedBattleCard || !pendingTarget) return;
                            // Safety: ensure ref is clear so battle effect can fire
                            battleInProgressRef.current = false;
                            // Confirm both cards - this STOPS the timer via playerBattleCard becoming non-null
                            setPlayerBattleCard(selectedBattleCard)
                            setOpponentBattleCard(pendingTarget)
                            setPendingTarget(null)
                            setIsTargeting(false)
                            setHoveredTargetRect(null)
                            console.log('⚔️ INITIATE CLASH - Timer stopped at:', timer)
                          }}
                        >
                          Initiate Clash
                        </button>
                        <button
                          className="px-8 py-4 text-white/40 text-xs font-bold uppercase tracking-[0.2em] hover:text-white transition-colors"
                          onClick={() => {
                            setPendingTarget(null)
                            setHoveredTargetRect(null)
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-red-500 animate-pulse text-xs font-bold uppercase tracking-[0.2em]">⚠️ Engaging Defensive Protocols</div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )
            }
            {/* End Grid Container (L1499 actually ended here if we want overlays inside, or sibling is fine) */}
            {/* I'll let L1586 close L1499 and keep these as siblings within L1421 */}



            {/* Opponent Summon Buttons - Mirrored at Top */}
            {
              (gameMode === 'last-citizen-standing' || gameMode === 'interlinked') && (
                <div className="fixed top-[150px] left-0 right-0 z-[60] flex justify-center items-center pointer-events-none">
                  <div className="pointer-events-auto flex items-center gap-4">

                    {/* Dark Lord (Opponent) */}
                    <div
                      ref={opponentSummonDarkLordRef}
                      className={`group relative flex flex-col items-center transition-all duration-300 ${opponentDarkLordUsed || isPlayerTurn || showBattleAnimation || battleResult || showBattleReport || pendingTarget ? 'opacity-20 grayscale' : 'opacity-100'}`}
                    >
                      <div className={`w-[70px] h-[70px] rounded-2xl overflow-hidden border transition-all duration-300 relative bg-black/80 z-10 ${opponentActiveSummon === 'dark-lord'
                        ? 'border-purple-500 shadow-[0_0_35px_rgba(168,85,247,0.8)] scale-110'
                        : 'border-white/10 shadow-lg'
                        }`}>
                        <img src="https://pbs.twimg.com/tweet_video_thumb/FSRyHOVXIAAQP3M.jpg" alt="Dark Lord" className="w-full h-full object-cover opacity-90" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-30" />
                      </div>
                      {/* Tooltip (Below) */}
                      <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-20">
                        <div className="w-2 h-2 bg-black/80 border-l border-t border-purple-500/30 rotate-45 absolute -top-1 left-1/2 -translate-x-1/2"></div>
                        <div className="bg-black/80  px-4 py-1.5 rounded-full border border-purple-500/30 text-purple-200 text-[10px] font-bold uppercase tracking-widest shadow-xl">
                          Opponent Dark Lord
                        </div>
                      </div>
                    </div>

                    {/* Angie (Opponent) */}
                    <div
                      ref={opponentSummonAngieRef}
                      className={`group relative flex flex-col items-center transition-all duration-300 ${opponentAngieUsed || isPlayerTurn || showBattleAnimation || battleResult || showBattleReport || pendingTarget ? 'opacity-20 grayscale' : 'opacity-100'}`}
                    >
                      <div className={`w-[70px] h-[70px] rounded-2xl overflow-hidden border transition-all duration-300 relative bg-black/70 z-10 ${opponentActiveSummon === 'angie'
                        ? 'border-yellow-500 shadow-[0_0_35px_rgba(234,179,8,0.8)] scale-110'
                        : 'border-white/10 shadow-lg'
                        }`}>
                        <img src="https://raw.githubusercontent.com/badfuture-926/neo-tokyo-card-clash/main/angie.png" alt="Angie" className="w-full h-full object-contain p-1 opacity-90" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-30" />
                      </div>
                      {/* Tooltip (Below) */}
                      <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-20">
                        <div className="w-2 h-2 bg-black/80 border-l border-t border-yellow-500/30 rotate-45 absolute -top-1 left-1/2 -translate-x-1/2"></div>
                        <div className="bg-black/80  px-4 py-1.5 rounded-full border border-yellow-500/30 text-yellow-200 text-[10px] font-bold uppercase tracking-widest shadow-xl">
                          Opponent Angie
                        </div>
                      </div>
                    </div>

                    {/* Angelic Overlord (Opponent) */}
                    <div
                      ref={opponentSummonAngelicRef}
                      className={`group relative flex flex-col items-center transition-all duration-300 ${opponentAngelicUsed || isPlayerTurn || showBattleAnimation || battleResult || showBattleReport || pendingTarget ? 'opacity-20 grayscale' : 'opacity-100'}`}
                    >
                      <div className={`w-[70px] h-[70px] rounded-2xl overflow-hidden border transition-all duration-300 relative bg-black/80 z-10 ${opponentActiveSummon === 'angelic-overlord'
                        ? 'border-blue-500 shadow-[0_0_35px_rgba(59,130,246,0.8)] scale-110'
                        : 'border-white/10 shadow-lg'
                        }`}>
                        <img src="https://neotokyo.codes/_next/image?url=https%3A%2F%2Fneo-tokyo.nyc3.cdn.digitaloceanspaces.com%2Fs1Citizen%2Fpngs%2F2350.png&w=1920&q=75" alt="Angelic" className="w-full h-full object-cover opacity-90" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-30" />
                      </div>
                      {/* Tooltip (Below) */}
                      <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-20">
                        <div className="w-2 h-2 bg-black/80 border-l border-t border-blue-500/30 rotate-45 absolute -top-1 left-1/2 -translate-x-1/2"></div>
                        <div className="bg-black/80  px-4 py-1.5 rounded-full border border-blue-500/30 text-blue-200 text-[10px] font-bold uppercase tracking-widest shadow-xl">
                          Opponent Overlord
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )
            }

            {
              (gameMode === 'last-citizen-standing' || gameMode === 'interlinked') && isPlayerTurn && (!isTargeting || activeSummon !== null) && !isRefreshPhase && (
                <div className="fixed bottom-[150px] left-0 right-0 z-[60] flex justify-center items-center pointer-events-none">
                  <div className="pointer-events-auto flex items-center gap-4">

                    {/* Dark Lord */}
                    <div
                      id="summon-darklord"
                      className={`group relative flex flex-col items-center cursor-pointer transition-all duration-300 ${darkLordUsed || selectedBattleCard || playerBattleCard || battleResult || showBattleAnimation || showBattleReport ? 'opacity-20 pointer-events-none grayscale' : ''} ${activeSummon && activeSummon !== 'darklord' ? 'opacity-20 grayscale pointer-events-none' : 'opacity-100'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (darkLordUsed) return;
                        const newState = activeSummon === 'darklord' ? null : 'darklord';
                        setActiveSummon(newState);
                        setIsTargeting(newState === 'darklord');
                      }}
                    >
                      <div className={`w-[70px] h-[70px] rounded-2xl overflow-hidden border transition-all duration-300 relative bg-black/80 group-hover:scale-110 ease-out z-10 ${activeSummon === 'darklord'
                        ? 'border-purple-500 shadow-[0_0_35px_rgba(168,85,247,0.8)] scale-110'
                        : 'border-white/10 group-hover:border-purple-500/50 shadow-lg group-hover:shadow-[0_0_35px_rgba(168,85,247,0.5)]'
                        }`}>
                        <img src="https://pbs.twimg.com/tweet_video_thumb/FSRyHOVXIAAQP3M.jpg" alt="Dark Lord" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {/* Tooltip */}
                      <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-20">
                        <div className="bg-black/80  px-4 py-1.5 rounded-full border border-purple-500/30 text-purple-200 text-[10px] font-bold uppercase tracking-widest shadow-xl">
                          Summon Dark Lord
                        </div>
                      </div>
                    </div>

                    {/* Angie */}
                    <div
                      className={`group relative flex flex-col items-center cursor-pointer transition-all duration-300 ${angieResurrectUsed || selectedBattleCard || playerBattleCard || battleResult || showBattleAnimation || showBattleReport ? 'opacity-20 pointer-events-none grayscale' : ''} ${activeSummon && activeSummon !== 'angie' ? 'opacity-20 grayscale pointer-events-none' : 'opacity-100'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (angieResurrectUsed) return;

                        setShowAngieGraveyard(true);
                      }}
                    >
                      <div className={`w-[70px] h-[70px] rounded-2xl overflow-hidden border transition-all duration-300 relative bg-black/70 group-hover:scale-110 ease-out z-10 ${showAngieGraveyard
                        ? 'border-yellow-500 shadow-[0_0_35px_rgba(234,179,8,0.8)] scale-110'
                        : 'border-white/10 group-hover:border-yellow-500/50 shadow-lg group-hover:shadow-[0_0_35px_rgba(234,179,8,0.5)]'
                        }`}>
                        <img src="https://raw.githubusercontent.com/badfuture-926/neo-tokyo-card-clash/main/angie.png" alt="Angie" className="w-full h-full object-contain p-1 opacity-90 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {/* Tooltip */}
                      <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-20">
                        <div className="bg-black/80  px-4 py-1.5 rounded-full border border-yellow-500/30 text-yellow-200 text-[10px] font-bold uppercase tracking-widest shadow-xl">
                          {angieResurrectUsed ? 'Ability Used' : 'Summon Angie'}
                        </div>
                      </div>
                    </div>

                    {/* Angelic Overlord */}
                    <div
                      className={`group relative flex flex-col items-center cursor-pointer transition-all duration-300 ${angelicOverlordUsed || selectedBattleCard || playerBattleCard || battleResult || showBattleAnimation || showBattleReport ? 'opacity-20 pointer-events-none grayscale' : ''} ${activeSummon && activeSummon !== 'angelic' ? 'opacity-20 grayscale pointer-events-none' : 'opacity-100'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (angelicOverlordUsed) return;
                        const newState = activeSummon === 'angelic' ? null : 'angelic';
                        setActiveSummon(newState);
                        setIsTargeting(newState === 'angelic');
                      }}
                    >
                      <div id="summon-angelic" className={`w-[70px] h-[70px] rounded-2xl overflow-hidden border transition-all duration-300 relative bg-black/80 group-hover:scale-110 ease-out z-10 ${activeSummon === 'angelic'
                        ? 'border-blue-500 shadow-[0_0_35px_rgba(59,130,246,0.8)] scale-110'
                        : 'border-white/10 group-hover:border-blue-500/50 shadow-lg group-hover:shadow-[0_0_35px_rgba(59,130,246,0.5)]'
                        }`}>
                        <img src="https://neotokyo.codes/_next/image?url=https%3A%2F%2Fneo-tokyo.nyc3.cdn.digitaloceanspaces.com%2Fs1Citizen%2Fpngs%2F2350.png&w=1920&q=75" alt="Angelic" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {/* Tooltip */}
                      <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-20">
                        <div className="bg-black/80  px-4 py-1.5 rounded-full border border-blue-500/30 text-blue-200 text-[10px] font-bold uppercase tracking-widest shadow-xl">
                          Summon Angelic Overlord
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )
            }

            {/* Player deck - bottom */}
            <div className="fixed bottom-0 left-0 right-0 flex justify-center items-center gap-2 p-4 bg-gradient-to-t from-black/90 to-transparent z-50">
              {playerDeck.map((cardId: number) => {
                // Hide card if it's currently in battle
                if (cardId === playerBattleCard) {
                  return (
                    <div key={cardId} className="w-32 opacity-0">
                      {/* Placeholder to maintain spacing */}
                    </div>
                  )
                }

                const isTargeted = opponentTargetCard === cardId || opponentSummonTarget === cardId

                return (
                  <div
                    key={cardId}
                    data-card-id={cardId}
                    ref={el => playerDeckRefs.current[cardId] = el}
                    className={`relative w-32 bg-gray-900/70 border rounded-lg overflow-hidden shadow-lg transition-all duration-300 ${
                      // Resurrect highlight — green glow
                      resurrectCardHighlight === cardId ? 'ring-4 ring-green-400 shadow-[0_0_30px_rgba(74,222,128,0.8)]' :
                      // Fully disabled: not player turn (and not targeted), battle result showing, or non-angelic summon active
                      ((activeSummon !== null && activeSummon !== 'angelic') || battleResult !== null || (!isPlayerTurn && !isRefreshPhase && !isTargeted)) ? 'opacity-20 cursor-not-allowed pointer-events-none' :
                      // Targeted by opponent
                      isTargeted ? 'opacity-100 scale-105 z-50 ring-4 ring-red-500 ring-offset-2 ring-offset-black shadow-[0_0_30px_rgba(239,68,68,0.8)]' :
                      // Player is targeting: dim non-selected cards but keep hoverable
                      (isTargeting && activeSummon !== 'angelic' && selectedBattleCard !== cardId) ? (hoveredDeckCard === cardId ? 'opacity-100 cursor-pointer' : 'opacity-40 cursor-pointer') :
                      'opacity-100 cursor-pointer'
                      } ${(selectedBattleCard === cardId && activeSummon !== 'angelic') ? 'border-2 border-[#0090ff] shadow-[0_0_15px_rgba(0,144,255,0.5)]' : hoveredDeckCard === cardId ? 'border-2 border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.6)] scale-105 z-10' : `border border-[#0077cc]/40 ${isPlayerTurn || isRefreshPhase || activeSummon === 'angelic' ? 'hover:border-yellow-400 hover:shadow-yellow-500/50' : ''}`}`}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();

                      // 1. Angelic Overlord Logic
                      if (activeSummon === 'angelic') {
                        applyAngelicEffect(cardId);
                        return;
                      }

                      // 2. Clear Timeout
                      if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                        hoverTimeoutRef.current = null;
                      }

                      // 3. Discard Logic
                      if ((gameMode === 'last-citizen-standing' || gameMode === 'interlinked') && isRefreshPhase) {
                        setSelectedForDiscard(cardId);
                        return;
                      }

                      // 4. Standard Battle Selection
                      if (!isPlayerTurn && !isRefreshPhase) return;

                      // Allow re-selecting a different card while targeting
                      if (isTargeting) {
                        setPendingTarget(null);
                        setHoveredTargetRect(null);
                      }

                      setHoveredDeckCard(null);
                      // NOTE: Timer continues because playerBattleCard is NOT set here
                      setSelectedBattleCard(cardId);
                      setIsTargeting(true);

                      const traits = citizenTraits[cardId];
                      if (traits) {
                        setBattleLog(null);
                      }
                    }}
                    onMouseEnter={(e) => {
                      // Angelic Targeting Line
                      if (activeSummon === 'angelic') {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredTargetRect({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
                        // setHoveredDeckCard(cardId); // Disabled to hide Selected Card View
                        return;
                      }

                      // Clear any pending timeout when entering a new card
                      if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                        hoverTimeoutRef.current = null;
                      }
                      // FIX: Disable hover during refresh phase
                      if (isRefreshPhase) return
                      // CRITICAL: Disable hover when it's not the player's turn (unless Angelic)
                      if (!isPlayerTurn && activeSummon !== 'angelic') return;
                      // Disable when player has a card on the battlefield (during clash)
                      if (playerBattleCard && activeSummon !== 'angelic') return;

                      setHoveredDeckCard(cardId);
                      getTraitsForCitizen(cardId);
                    }}
                    onMouseLeave={() => {
                      if (activeSummon === 'angelic') {
                        setHoveredTargetRect(null);
                      }

                      // Set a 200ms delay before clearing the hover
                      hoverTimeoutRef.current = setTimeout(() => {
                        setHoveredDeckCard(null);
                        hoverTimeoutRef.current = null;
                      }, 200);
                    }}
                  >
                    <img src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${cardId}.png`} alt={`Citizen ${cardId}`} className="w-full aspect-square object-cover" />

                    {/* Debuff Flash overlay - Player Wide (-10%) */}
                    {debuffFlashPlayer > 0 && Date.now() - debuffFlashPlayer < 2500 && (
                      <div className="absolute inset-0 z-40 flex items-center justify-center bg-red-600/40 animate-pulse transition-all duration-300 rounded-lg">
                        <div className="text-white text-xl font-black italic shadow-2xl">-10%</div>
                      </div>
                    )}
                    {/* Buff Flash overlay - Target (+50%) */}
                    {buffFlashTarget === cardId && (
                      <div className="absolute inset-0 z-40 flex items-center justify-center bg-green-500/40 animate-pulse transition-all duration-300 rounded-lg">
                        <div className="text-white text-3xl font-black italic shadow-2xl drop-shadow-[0_0_10px_rgba(0,255,0,0.8)]">+50%</div>
                      </div>
                    )}

                    {/* Individual Summon Flash Effects */}
                    {cardFlashEffects[cardId] && (
                      <div className={`absolute inset-0 z-[60] flex items-center justify-center animate-flash-text pointer-events-none bg-${cardFlashEffects[cardId].color}-500/20`}>
                        <div className={`text-${cardFlashEffects[cardId].color}-400 text-3xl font-black italic drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]`}>
                          {cardFlashEffects[cardId].text}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {
              gameOver && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/98  animate-in fade-in duration-1000" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  <div className="text-center px-8">
                    <span className="text-white/40 font-black uppercase tracking-[0.5em] text-xs">Final Transmission</span>
                    <h1 className={`text-[10vw] font-black italic tracking-tighter leading-none mt-4 ${gameOver === 'win' ? 'text-white' : 'text-red-600'}`}>
                      {gameOver === 'win' ? 'DOMINANCE' : 'EXTINCTION'}
                    </h1>
                    <div className="mt-12 flex flex-col items-center gap-8">
                      <div className="text-4xl font-black text-white/80 tracking-widest">SCORE: {playerScore} — {opponentScore}</div>
                      <button
                        className="px-16 py-6 bg-white text-black font-black text-2xl tracking-[0.2em] hover:scale-105 transition-all rounded-full"
                        onClick={() => window.location.reload()}
                      >
                        REBOOT SYSTEM
                      </button>
                    </div>
                  </div>
                </div>
              )
            }
          </div >
        )}

        {/* Hover Card Detail Popup - Shows when hovering over player deck card */}
        {hoveredDeckCard && !isRefreshPhase && (
          <div className="fixed inset-0 pointer-events-none z-[150] flex items-center justify-center p-4 bg-black/80">
            {/* Main Centered Card with Traits - Mirrored from Discard Phase Inspection */}
            <div className="bg-gradient-to-b from-gray-900 to-black border-4 border-[#0077cc] rounded-2xl w-full max-w-[280px] overflow-hidden shadow-2xl shadow-[#0055aa]/70 relative animate-in zoom-in-95 duration-200">
              <h3 className="text-sm font-bold text-[#4db8ff] text-center pt-2 pb-1">Citizen #{hoveredDeckCard}</h3>
              <div className="w-full aspect-square bg-black flex items-center justify-center border-b-4 border-[#0055aa]/50">
                <img
                  src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${hoveredDeckCard}.png`}
                  alt={`Citizen #${hoveredDeckCard}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-2 pt-1">
                {(() => {
                  const traits = citizenTraits[hoveredDeckCard]
                  if (!traits) return <div className="text-[#4db8ff] text-[10px] text-center py-4 italic">Loading data stream...</div>

                  // Compare current scores vs original max scores
                  let currentScores: CardTraitScores | null = null
                  let originalScores: CardTraitScores | null = null

                  if (gameMode === 'interlinked') {
                    currentScores = cardTraitScores[hoveredDeckCard]
                    originalScores = getInitialTraitScores(hoveredDeckCard)
                  }

                  const availableTraits = getAvailableTraits()

                  return (
                    <div className={`grid ${gameMode === 'last-citizen-standing' ? 'grid-cols-3' :
                      gameMode === 'chaotic' || gameMode === 'threat-intelligence' || gameMode === 'interlinked' ? 'grid-cols-3' :
                        'grid-cols-4'
                      } gap-1 text-center`}>
                      {availableTraits.map(({ label, value: traitKey, key }) => {
                        const value = traits[traitKey as keyof CitizenTraits]

                        let displayValue: string | number = value
                        if (gameMode === 'interlinked' && currentScores && originalScores) {
                          const current = (currentScores as any)[traitKey]
                          const original = (originalScores as any)[traitKey]

                          // Only show score if it is damaged (less than original)
                          if (typeof current === 'number' && typeof original === 'number' && current < original) {
                            displayValue = `${value} (${current})`
                          }
                        }

                        return (
                          <div key={label} className="bg-gray-800/70 border border-[#0055aa]/40 rounded p-1 h-[45px] flex flex-col justify-center opacity-90 transition-all">
                            <div className="text-[#0090ff] font-semibold leading-tight text-[8px] tracking-tighter uppercase">{label}</div>
                            <div className={`text-[11px] font-bold leading-tight overflow-hidden text-ellipsis line-clamp-2 ${isUltraRareTrait(key, value) ? 'text-yellow-400' : isRareTrait(key, value) ? 'text-purple-300' : 'text-white/90'}`}>
                              {displayValue}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        )
        }
        {/* Phase 3 & 4: Elimination Notification & Angie Resurrection UI */}

        {/* Elimination Notification Overlay */}
        {/* Elimination Notification Overlay */}
        {eliminationNotice && eliminationNotice.visible && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none">
            <div className={`bg-black/80 px-12 py-6 rounded-2xl border shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-50 duration-300 ${eliminationNotice.message === 'RESURRECTED'
              ? 'border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.5)]'
              : 'border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.5)]'
              }`}>
              <h2 className={`text-4xl font-black tracking-[0.2em] italic uppercase drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] ${eliminationNotice.message === 'RESURRECTED'
                ? 'text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]'
                : 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                }`}>
                {eliminationNotice.message}
              </h2>
            </div>
          </div>
        )}

        {/* Angie's Graveyard Modal */}
        {showAngieGraveyard && (
          <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
            <div
              className="relative w-full h-full bg-black flex flex-col overflow-hidden"
              style={{ backgroundImage: "url('https://raw.githubusercontent.com/badfuture-926/neo-tokyo-card-clash/main/Neo%20Tokyo%20Card%20Clash%20-%20RESURRECT%20Background.png')", backgroundSize: '90%', backgroundPosition: 'center 20%', backgroundRepeat: 'no-repeat' }}
            >
              {/* Dark Overlay for Readability - gradient to keep top visible */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black/90 pointer-events-none" />
              {/* Side fades to blend edges into black */}
              <div className="absolute inset-y-0 left-0 w-[10%] bg-gradient-to-r from-black to-transparent pointer-events-none z-[1]" />
              <div className="absolute inset-y-0 right-0 w-[10%] bg-gradient-to-l from-black to-transparent pointer-events-none z-[1]" />

              {/* Header */}
              <div className="relative z-10 p-6 flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black text-yellow-500 italic tracking-tighter uppercase">Angie's Resurrection</h2>
                  <p className="text-yellow-500/60 text-xs font-bold tracking-widest uppercase mt-1">Select a fallen citizen to revive at 80% power</p>
                </div>
                <button
                  onClick={() => {
                    setShowAngieGraveyard(false)
                    setSelectedGraveyardCard(null)
                  }}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white/40 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Grid Content */}
              <div className="relative z-10 flex-1 overflow-y-auto p-8 flex flex-col justify-center min-h-0">
                {playerGraveyard.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/20">
                    <div className="text-6xl mb-4">🪦</div>
                    <div className="font-bold text-xl uppercase tracking-widest">No fallen citizens to resurrect</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {playerGraveyard.map((graveCard) => (
                      <div
                        key={graveCard.id}
                        onClick={() => setSelectedGraveyardCard(graveCard.id)}
                        className={`relative group cursor-pointer transition-all duration-300 rounded-xl overflow-hidden border-2 
                        ${selectedGraveyardCard === graveCard.id
                            ? 'border-yellow-500 scale-105 shadow-[0_0_30px_rgba(234,179,8,0.4)]'
                            : 'border-white/5 hover:border-yellow-500/50 hover:shadow-lg opacity-60 hover:opacity-100 grayscale hover:grayscale-0'
                          }`}
                      >
                        <div className="aspect-square relative">
                          <img
                            src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${graveCard.id}.png`}
                            alt={`Citizen ${graveCard.id}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-8">
                            <div className="text-yellow-200 font-bold text-lg leading-none">#{graveCard.id}</div>
                            <div className="text-white/40 text-[10px] font-bold uppercase tracking-wider mt-1">Turn {graveCard.eliminatedTurn}</div>
                          </div>
                          {selectedGraveyardCard === graveCard.id && (
                            <div className="absolute top-2 right-2 bg-yellow-500 text-black text-[10px] font-black px-2 py-1 rounded-sm uppercase tracking-widest animate-pulse">
                              Selected
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer / Preview Panel Placeholder */}
              {/* The actual preview panel is overlayed at the bottom, or can be part of the modal footer */}
            </div>
          </div>
        )}

        {/* Phase 4: Resurrection Preview Panel */}
        {showAngieGraveyard && selectedGraveyardCard !== null && (
          <div className="fixed bottom-0 left-0 right-0 z-[260] bg-gray-900 border-t border-yellow-500/30 p-8 pb-12 shadow-[0_-10px_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom duration-300">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-center">

              {/* Card Preview */}
              <div className="w-32 md:w-48 aspect-square rounded-xl overflow-hidden border-2 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] relative shrink-0">
                <img
                  src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${selectedGraveyardCard}.png`}
                  alt="Resurrect Target"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-yellow-500/10 mix-blend-overlay" />
              </div>

              {/* Stats Comparison */}
              <div className="flex-1 w-full pl-4 overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-yellow-500/20 scrollbar-track-transparent">
                {(() => {
                  const graveCard = playerGraveyard.find(c => c.id === selectedGraveyardCard)
                  if (!graveCard) return null

                  // Helper to calculate stats
                  const { originalTraits } = graveCard
                  const comparisonData: { label: string, traitName: string | null, original: number, resurrected: number }[] = []

                  const traitKeyToLabel: Record<string, string> = {
                    race: 'Race', class: 'Class', eyes: 'Eyes', ability: 'Ability',
                    additionalItem: 'Item', helm: 'Helm', location: 'Location',
                    vehicle: 'Vehicle', apparel: 'Apparel', weapon: 'Weapon',
                    rewardRate: 'Reward', strength: 'Strength', intelligence: 'Intelligence',
                    cool: 'Cool', techSkill: 'Tech Skill', attractiveness: 'Attractiveness',
                  }

                  if (gameMode === 'last-citizen-standing') {
                    const numericKeys: (keyof CitizenTraits)[] = ['strength', 'intelligence', 'cool', 'techSkill', 'attractiveness']
                    numericKeys.forEach(key => {
                      const val = originalTraits[key] as number
                      comparisonData.push({ label: traitKeyToLabel[key] || key, traitName: null, original: val, resurrected: Math.ceil(val * 0.8) })
                    })
                    const reward = parseFloat(String(originalTraits.rewardRate)) || 0
                    comparisonData.push({ label: 'Reward', traitName: null, original: reward, resurrected: Math.ceil(reward * 0.8) })
                  } else {
                    const scores = getInitialTraitScores(selectedGraveyardCard, originalTraits)
                    if (scores) {
                      Object.keys(scores).forEach(key => {
                        const k = key as keyof CardTraitScores
                        const val = scores[k]
                        const traitName = typeof originalTraits[k as keyof CitizenTraits] === 'string'
                          ? String(originalTraits[k as keyof CitizenTraits])
                          : null
                        comparisonData.push({ label: traitKeyToLabel[k] || key, traitName, original: val, resurrected: Math.ceil(val * 0.8) })
                      })
                    }
                  }

                  return (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {comparisonData.map((stat) => {
                        const val = stat.resurrected
                        const isGold = val >= 80
                        const isPurple = val >= 50 && val < 80
                        const isRed = val === 0
                        const colorClass = isRed ? 'text-red-500' : isGold ? 'text-yellow-400' : isPurple ? 'text-purple-300' : 'text-white/90'

                        return (
                          <div key={stat.label} className="bg-gray-800/70 border border-[#0055aa]/40 rounded p-1.5 flex flex-col justify-center relative group select-none hover:border-yellow-500/50 transition-all">
                            <div className="text-[#0090ff] font-semibold leading-tight text-[8px] tracking-tighter uppercase mb-0.5">{stat.label}</div>
                            {stat.traitName && (
                              <div className="text-white/50 text-[9px] leading-tight truncate mb-0.5">{stat.traitName}</div>
                            )}
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-white/30 text-[10px] line-through decoration-white/20">{stat.original}</span>
                              <span className={`text-[12px] font-black ${colorClass}`}>{stat.resurrected}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>

              {/* Action Button */}
              <button
                onClick={handleResurrect}
                className="shrink-0 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xl px-12 py-5 rounded-full uppercase tracking-widest shadow-[0_0_30px_rgba(234,179,8,0.4)] hover:shadow-[0_0_50px_rgba(234,179,8,0.6)] hover:scale-105 active:scale-95 transition-all"
              >
                Resurrect
              </button>
            </div>
          </div>
        )}

      </div >
    </div >
  )
}

export default App