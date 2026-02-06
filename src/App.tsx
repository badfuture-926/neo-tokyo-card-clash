import React, { useState, useEffect, useRef } from 'react'
import './style.css'
import { isRareTrait, isUltraRareTrait, getTraitCount } from './rareTraits'

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

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showGameModes, setShowGameModes] = useState(false)
  const [gameMode, setGameMode] = useState<'omnipresent' | 'chaotic' | 'threat-intelligence' | 'last-citizen-standing' | null>(null)
  const [citizens, setCitizens] = useState<CitizenCard[]>([])
  const [citizenTraits, setCitizenTraits] = useState<Record<number, CitizenTraits>>({})

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

  // Game phases
  const [gamePhase, setGamePhase] = useState<'discard' | 'battle'>('discard')
  const [discardedCards, setDiscardedCards] = useState<number[]>([])
  const [playerDeck, setPlayerDeck] = useState<number[]>([])
  const [opponentDeck, setOpponentDeck] = useState<number[]>([])
  const [timer, setTimer] = useState<number>(30)

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

  // Game state
  const [playerScore, setPlayerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [battleResult, setBattleResult] = useState<{ winner: 'player' | 'opponent' | 'tie', message: string } | null>(null)
  const [showBattleAnimation, setShowBattleAnimation] = useState(false)
  const [gameOver, setGameOver] = useState<'win' | 'lose' | null>(null)

  // Phase 5: Turn counter and refresh
  const [turnCount, setTurnCount] = useState(0)
  const [isRefreshPhase, setIsRefreshPhase] = useState(false)
  const [refreshDrawnCard, setRefreshDrawnCard] = useState<number | null>(null)
  const [lastRefreshCard, setLastRefreshCard] = useState<number | null>(null) // Track last refresh card to protect from elimination
  const [playerRefreshDiscarded, setPlayerRefreshDiscarded] = useState(false)
  const [aiRefreshDiscarded, setAiRefreshDiscarded] = useState(false)

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
  const [showSpecialAbilityInfo, setShowSpecialAbilityInfo] = useState<string | null>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null) // For sticky hover delay

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

  const startGameWithMode = (mode: 'omnipresent' | 'chaotic' | 'threat-intelligence' | 'last-citizen-standing') => {
    setGameMode(mode)
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
    if (selectedForDiscard && !discardedCards.includes(selectedForDiscard)) {
      if (isRefreshPhase) {
        // Refresh Phase specific discard logic
        console.log(`[DEBUG] handleDiscard (Refresh) - Selected: ${selectedForDiscard}, New Card: ${refreshDrawnCard}`)
        console.log(`[DEBUG] refreshDrawnCard value:`, refreshDrawnCard)
        console.log(`[DEBUG] refreshDrawnCard type:`, typeof refreshDrawnCard)

        setPlayerDeck(prev => {
          console.log(`[DEBUG] Inside setPlayerDeck - prev:`, prev)
          console.log(`[DEBUG] Inside setPlayerDeck - refreshDrawnCard:`, refreshDrawnCard)
          const filtered = prev.filter(id => id !== selectedForDiscard)
          console.log(`[DEBUG] After filter - filtered:`, filtered)
          const newDeck = refreshDrawnCard ? [...filtered, refreshDrawnCard as number] : filtered
          console.log(`[DEBUG] Deck - Before: ${prev.length}, Filtered: ${filtered.length}, NewCard: ${refreshDrawnCard}, Final: ${newDeck.length}`)
          console.log(`[DEBUG] Final newDeck:`, newDeck)
          return newDeck
        })

        // Protect the new card from elimination
        if (refreshDrawnCard) {
          setLastRefreshCard(refreshDrawnCard)
        }

        setPlayerRefreshDiscarded(true)
        // Don't manually end refresh phase - it will end when turn progresses
        setRefreshDrawnCard(null)
        setSelectedForDiscard(null)
        return
      }

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
        setGamePhase('battle')
        setSelectedForDiscard(null)
      }
    }
  }

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
        return traits
      }
    }
    return citizenTraits[citizenId]
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

  // Execute battle when both cards are placed
  useEffect(() => {
    const readyForBattle = playerBattleCard && opponentBattleCard && !battleResult

    if (readyForBattle) {
      setShowBattleAnimation(true)

      setTimeout(() => {
        const playerTraits = citizenTraits[playerBattleCard!]
        const opponentTraits = citizenTraits[opponentBattleCard!]

        if (!playerTraits || !opponentTraits) return

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

        setBattleResult({ winner, message })
        setShowBattleAnimation(false)

        // Handle Scoring
        if (winner === 'player') {
          setPlayerScore((s: number) => s + 1)
        } else if (winner === 'opponent') {
          setOpponentScore((s: number) => s + 1)
        }

        // Handle Deck Persistence
        if (gameMode !== 'last-citizen-standing') {
          if (winner === 'player') opponentDead = true
          else if (winner === 'opponent') playerDead = true
        }

        if (playerDead) {
          setPlayerDeck((prev: number[]) => prev.filter(id => id !== playerBattleCard))
        }
        if (opponentDead) {
          setOpponentDeck((prev: number[]) => prev.filter(id => id !== opponentBattleCard))
        }

        setTurnCount((prev: number) => {
          const newTurnCount = prev + 1

          // Phase 12: Periodic Card Deal is now handled by Refresh Phase (lines 874-983)
          // The old automatic card draw logic has been removed to prevent conflicts

          return newTurnCount
        })

        setTimeout(() => {
          setBattleResult(null)
          setPlayerBattleCard(null)
          setPlayerSelectedTrait(null)
          setPlayerSelectedSecondTrait(null)
          setOpponentBattleCard(null)
          setOpponentSelectedTrait(null)
          setOpponentSelectedSecondTrait(null)
          setIsPlayerTurn(!isPlayerTurn)
          setTimer(30)
        }, 1500)
      }, 1500)
    }
  }, [playerBattleCard, opponentBattleCard, battleResult, gameMode, isPlayerTurn, playerScore, opponentScore, citizenTraits, getTraitCount, getTraitKey, playerDeck.length, opponentDeck.length])

  // Phase 11: LCS Auto-Elimination Sweeper (3+ Zero Traits)
  useEffect(() => {
    if (gameMode !== 'last-citizen-standing') return
    // Skip elimination during refresh phase - players are actively managing their deck
    if (isRefreshPhase) return

    const checkElimination = (deck: number[]) => {
      return deck.filter(cardId => {
        const traits = citizenTraits[cardId]
        if (!traits) return true // Keep if traits haven't loaded yet to be safe

        const zeroTraitsCount = [
          traits.strength, traits.intelligence, traits.cool,
          traits.techSkill, traits.attractiveness,
          parseFloat(traits.rewardRate) || 0
        ].filter(v => v === 0 || v === "0").length

        // Cards with 3+ zero traits should always be eliminated, even if they're the last refresh card
        if (zeroTraitsCount >= 3) return false

        // Protect the last refresh card from elimination (only if it has < 3 zeros)
        if (cardId === lastRefreshCard) return true

        return zeroTraitsCount < 3
      })
    }

    const cleanPlayerDeck = checkElimination(playerDeck)
    if (cleanPlayerDeck.length !== playerDeck.length) {
      const removedCards = playerDeck.filter(id => !cleanPlayerDeck.includes(id))
      console.log(`[DEBUG] checkElimination removed ${removedCards.length} cards from player deck:`, removedCards)
      setPlayerDeck(cleanPlayerDeck)
      if (cleanPlayerDeck.length === 0) setGameOver('lose')
    }

    const cleanOpponentDeck = checkElimination(opponentDeck)
    if (cleanOpponentDeck.length !== opponentDeck.length) {
      setOpponentDeck(cleanOpponentDeck)
      if (cleanOpponentDeck.length === 0) setGameOver('win')
    }
  }, [citizenTraits, playerDeck, opponentDeck, gameMode, isRefreshPhase, lastRefreshCard])

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

  // Central Game Over Logic
  useEffect(() => {
    if (!gameStarted || gameOver || gamePhase !== 'battle') return

    if (gameMode === 'last-citizen-standing') {
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
  }, [playerDeck.length, opponentDeck.length, playerScore, opponentScore, gameMode, gameStarted, gameOver])


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
    if (gameMode === 'last-citizen-standing' && !isPlayerTurn && !playerBattleCard && !opponentBattleCard && !battleResult && !isRefreshPhase && opponentDeck.length > 0) {

      // Step 1: Thinking delay (1.5s)
      const thinkingTimer = setTimeout(() => {

        // AI Picks Attacker
        const aiCardId = aiChooseCard('Average', '0', false)
        setOpponentBattleCard(aiCardId)

        // Step 2: Targeting Phase (1s)
        setTimeout(() => {
          setIsTargeting(true)

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

          // Simulate hover over player deck for the gold line
          // We'll target the card in the deck tray
          const targetEl = document.querySelector(`[data-card-id="${targetId}"]`)
          if (targetEl) {
            const rect = targetEl.getBoundingClientRect()
            setHoveredTargetRect({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
          } else {
            // Fallback to center bottom if element not found
            setHoveredTargetRect({ x: window.innerWidth / 2, y: window.innerHeight - 100 })
          }

          // Step 3: Conflict Preview (1.5s)
          setTimeout(() => {
            setIsTargeting(false)
            setPendingTarget(targetId)
            setHoveredTargetRect(null)

            // Step 4: Auto-initiate Clash (2.5s)
            setTimeout(() => {
              // Only proceed if we're still in this state
              setPlayerBattleCard(targetId)
              setPendingTarget(null)
            }, 2500)

          }, 1500)

        }, 1000)

      }, 1500)

      return () => clearTimeout(thinkingTimer)
    }
  }, [isPlayerTurn, opponentDeck, playerDeck, gameMode, playerBattleCard, opponentBattleCard, battleResult, isRefreshPhase])


  // Phase 5: Check for refresh phase every 10 turns (Last Citizen Standing mode)
  useEffect(() => {
    if (gameMode !== 'last-citizen-standing') return

    // Check if we should be in refresh phase
    // Turn 10, 20, 30 etc.
    if (turnCount > 0 && turnCount % 10 === 0) {
      // If we are already in refresh phase OR player has already discarded, do nothing
      if (isRefreshPhase || playerRefreshDiscarded) return;

      console.log(`[DEBUG] Initiating Refresh Phase (Turn ${turnCount}). battleResult present: ${!!battleResult}`)

      // Force refresh phase even if battle result is showing
      // This ensures we don't get stuck if turnCount updates before battleResult clears
      setIsRefreshPhase(true)
      setPlayerRefreshDiscarded(false)
      setAiRefreshDiscarded(false)
      setLastRefreshCard(null) // Clear previous refresh card protection

      // Safety: Ensure AI turn doesn't proceed
      setIsTargeting(false)
      setPendingTarget(null)

      const usedIds = new Set([
        ...playerDeck,
        ...opponentDeck,
        ...discardedCards
      ])

      let playerNewCardId: number | null = null
      let aiNewCardId: number | null = null

      const vCitizens = citizens.filter(c => c.loaded)
      const allIds = Array.from({ length: 3968 }, (_, i) => i + 1)
        .filter(id => id !== 0 && !usedIds.has(id))

      const pickRandom = (exclude: number | null) => {
        const pool = allIds.filter(id => id !== exclude)
        return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null
      }

      for (let i = 0; i < vCitizens.length; i++) {
        const cardId = vCitizens[i].id
        if (!usedIds.has(cardId)) {
          if (!playerNewCardId) playerNewCardId = cardId
          else if (!aiNewCardId) { aiNewCardId = cardId; break }
        }
      }

      if (!playerNewCardId) playerNewCardId = pickRandom(null)
      if (!aiNewCardId) aiNewCardId = pickRandom(playerNewCardId)

      if (playerNewCardId) {
        console.log(`[DEBUG] Setting refreshDrawnCard to: ${playerNewCardId}`)
        setRefreshDrawnCard(playerNewCardId)
      }

      const loadTraits = (id: number) => {
        if (!citizenTraits[id]) {
          fetch(`https://eth-mainnet.g.alchemy.com/nft/v3/0uBM1JotEbL5ERgVwcDEa/getNFTMetadata?contractAddress=0x86357A19E5537A8Fba9A004E555713BC943a66C0&tokenId=${id}&refreshCache=false`)
            .then(res => res.json())
            .then(data => {
              const attrs = data.raw?.metadata?.attributes || []
              const newTraits: CitizenTraits = { class: 'Unknown', race: 'Unknown', strength: 0, intelligence: 0, attractiveness: 0, techSkill: 0, cool: 0, eyes: 'Unknown', ability: 'None', location: 'Unknown', additionalItem: 'None', weapon: 'None', vehicle: 'None', apparel: 'None', helm: 'None', rewardRate: '0' }

              attrs.forEach((attr: { trait_type: string, value: string | number }) => {
                const traitType = attr.trait_type?.toLowerCase().replace(/\s+/g, '')
                const value = attr.value
                switch (traitType) {
                  case 'class': newTraits.class = String(value); break
                  case 'race': newTraits.race = String(value); break
                  case 'strength': newTraits.strength = Number(value) || 0; break
                  case 'intelligence': newTraits.intelligence = Number(value) || 0; break
                  case 'attractiveness': newTraits.attractiveness = Number(value) || 0; break
                  case 'techskill': newTraits.techSkill = Number(value) || 0; break
                  case 'cool': newTraits.cool = Number(value) || 0; break
                  case 'eyes': newTraits.eyes = String(value); break
                  case 'ability': newTraits.ability = String(value); break
                  case 'location': newTraits.location = String(value); break
                  case 'additionalitem': newTraits.additionalItem = String(value); break
                  case 'weapon': newTraits.weapon = String(value); break
                  case 'vehicle': newTraits.vehicle = String(value); break
                  case 'apparel': newTraits.apparel = String(value); break
                  case 'helm': newTraits.helm = String(value); break
                  case 'rewardrate': newTraits.rewardRate = String(value); break
                }
              })
              setCitizenTraits(prev => ({ ...prev, [id]: newTraits }))
            })
            .catch(err => console.error('Failed to load refresh card traits:', err))
        }
      }

      if (playerNewCardId) loadTraits(playerNewCardId)
      if (aiNewCardId) loadTraits(aiNewCardId)

      setTimeout(() => {
        if (opponentDeck.length > 0) {
          const weakestCard = opponentDeck.reduce((weakest, cardId) => {
            const traits = citizenTraits[cardId]
            const weakestTraits = citizenTraits[weakest]
            if (!traits) return weakest
            if (!weakestTraits) return cardId
            const cardTotal = traits.strength + traits.intelligence + traits.cool + traits.techSkill + traits.attractiveness + (typeof traits.rewardRate === 'number' ? traits.rewardRate : parseFloat(traits.rewardRate) || 0)
            const weakestTotal = weakestTraits.strength + weakestTraits.intelligence + weakestTraits.cool + weakestTraits.techSkill + weakestTraits.attractiveness + (typeof weakestTraits.rewardRate === 'number' ? weakestTraits.rewardRate : parseFloat(weakestTraits.rewardRate) || 0)
            return cardTotal < weakestTotal ? cardId : weakest
          }, opponentDeck[0])

          setOpponentDeck((prev: number[]) => prev.filter(id => id !== weakestCard))
          setAiRefreshDiscarded(true)
          if (aiNewCardId) setOpponentDeck((prev: number[]) => [...prev, aiNewCardId!])
        }
      }, 1000)
    }
  }, [turnCount, gameMode, isRefreshPhase, battleResult, playerDeck, opponentDeck, discardedCards, citizens, citizenTraits])

  // End refresh phase after both players have discarded
  useEffect(() => {
    if (!isRefreshPhase) return
    if (!playerRefreshDiscarded || !aiRefreshDiscarded) return

    console.log('[DEBUG] Both players discarded, ending refresh phase')

    // End refresh phase and progress turn
    setTimeout(() => {
      setIsRefreshPhase(false)
      setPlayerRefreshDiscarded(false)
      setAiRefreshDiscarded(false)
      setTurnCount(prev => prev + 1)
    }, 500)
  }, [isRefreshPhase, playerRefreshDiscarded, aiRefreshDiscarded])


  // Timer countdown
  useEffect(() => {
    if (!gameStarted) return
    if (gamePhase === 'discard' && validCitizens.length < 24) return
    // Removed: Timer should keep running during targeting and conflict initiated modes

    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev: number) => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    } else {
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

        setGamePhase('battle')
        setTimer(30)
      } else if (gamePhase === 'battle' && isPlayerTurn) {
        // Timer expired during player's turn - force the player to make a move

        // Case 1: Player has a card on battlefield and a pending target - force the attack
        if (playerBattleCard && pendingTarget) {
          console.log('Timer expired - forcing attack with pending target:', pendingTarget)
          setOpponentBattleCard(pendingTarget)
          setPendingTarget(null)
          setIsTargeting(false)
          setHoveredTargetRect(null)
          setShowBattleAnimation(true)
          setTimeout(() => {
            setShowBattleAnimation(false)
            // Resolve battle
            const pTraits = citizenTraits[playerBattleCard]
            const oTraits = citizenTraits[pendingTarget]
            if (pTraits && oTraits) {
              const pTotal = (pTraits.strength || 0) + (pTraits.intelligence || 0) + (pTraits.cool || 0) + (pTraits.techSkill || 0) + (pTraits.attractiveness || 0)
              const oTotal = (oTraits.strength || 0) + (oTraits.intelligence || 0) + (oTraits.cool || 0) + (oTraits.techSkill || 0) + (oTraits.attractiveness || 0)
              const playerWins = pTotal >= oTotal
              setBattleResult({
                winner: playerWins ? 'player' : 'opponent',
                message: playerWins ? `Your citizen's combined stats (${pTotal}) beat the opponent (${oTotal})!` : `Opponent's combined stats (${oTotal}) defeated yours (${pTotal}).`
              })
              if (playerWins) {
                setPlayerScore((prev: number) => prev + 1)
                setOpponentDeck((prev: string[]) => prev.filter((id: string) => id !== pendingTarget))
              } else {
                setOpponentScore((prev: number) => prev + 1)
                setPlayerDeck((prev: string[]) => prev.filter((id: string) => id !== playerBattleCard))
              }
            }
          }, 1500)
          setTimer(30)
          return
        }

        // Case 2: Player has a card on battlefield but is in targeting mode - choose random target and attack
        if (playerBattleCard && (isTargeting || !opponentBattleCard)) {
          const randomTarget = opponentDeck[Math.floor(Math.random() * opponentDeck.length)]
          if (randomTarget) {
            console.log('Timer expired - forcing attack on random target:', randomTarget)
            setOpponentBattleCard(randomTarget)
            setIsTargeting(false)
            setPendingTarget(null)
            setHoveredTargetRect(null)
            setShowBattleAnimation(true)
            setTimeout(() => {
              setShowBattleAnimation(false)
              // Resolve battle
              const pTraits = citizenTraits[playerBattleCard]
              const oTraits = citizenTraits[randomTarget]
              if (pTraits && oTraits) {
                const pTotal = (pTraits.strength || 0) + (pTraits.intelligence || 0) + (pTraits.cool || 0) + (pTraits.techSkill || 0) + (pTraits.attractiveness || 0)
                const oTotal = (oTraits.strength || 0) + (oTraits.intelligence || 0) + (oTraits.cool || 0) + (oTraits.techSkill || 0) + (oTraits.attractiveness || 0)
                const playerWins = pTotal >= oTotal
                setBattleResult({
                  winner: playerWins ? 'player' : 'opponent',
                  message: playerWins ? `Your citizen's combined stats (${pTotal}) beat the opponent (${oTotal})!` : `Opponent's combined stats (${oTotal}) defeated yours (${pTotal}).`
                })
                if (playerWins) {
                  setPlayerScore((prev: number) => prev + 1)
                  setOpponentDeck((prev: string[]) => prev.filter((id: string) => id !== randomTarget))
                } else {
                  setOpponentScore((prev: number) => prev + 1)
                  setPlayerDeck((prev: string[]) => prev.filter((id: string) => id !== playerBattleCard))
                }
              }
            }, 1500)
            setTimer(30)
            return
          }
        }

        // Case 3: Player hasn't deployed a card yet - deploy random card and attack random target
        if (!playerBattleCard) {
          const availableCards = playerDeck.filter((id: string) => id !== playerBattleCard)
          if (availableCards.length > 0 && opponentDeck.length > 0) {
            const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)]
            const randomTarget = opponentDeck[Math.floor(Math.random() * opponentDeck.length)]
            console.log('Timer expired - deploying random card and attacking:', randomCard, 'vs', randomTarget)

            setPlayerBattleCard(randomCard)
            setOpponentBattleCard(randomTarget)
            setShowBattleAnimation(true)
            setTimeout(() => {
              setShowBattleAnimation(false)
              // Resolve battle
              const pTraits = citizenTraits[randomCard]
              const oTraits = citizenTraits[randomTarget]
              if (pTraits && oTraits) {
                const pTotal = (pTraits.strength || 0) + (pTraits.intelligence || 0) + (pTraits.cool || 0) + (pTraits.techSkill || 0) + (pTraits.attractiveness || 0)
                const oTotal = (oTraits.strength || 0) + (oTraits.intelligence || 0) + (oTraits.cool || 0) + (oTraits.techSkill || 0) + (oTraits.attractiveness || 0)
                const playerWins = pTotal >= oTotal
                setBattleResult({
                  winner: playerWins ? 'player' : 'opponent',
                  message: playerWins ? `Your citizen's combined stats (${pTotal}) beat the opponent (${oTotal})!` : `Opponent's combined stats (${oTotal}) defeated yours (${pTotal}).`
                })
                if (playerWins) {
                  setPlayerScore((prev: number) => prev + 1)
                  setOpponentDeck((prev: string[]) => prev.filter((id: string) => id !== randomTarget))
                } else {
                  setOpponentScore((prev: number) => prev + 1)
                  setPlayerDeck((prev: string[]) => prev.filter((id: string) => id !== randomCard))
                }
              }
            }, 1500)
            setTimer(30)
          }
        }
      }
    }
  }, [timer, gameStarted, gamePhase, validCitizens, discardedCards, playerBattleCard, playerDeck, opponentDeck, citizenTraits, pendingTarget, isTargeting, isPlayerTurn])

  // Removed: Timer reset when card is retracted - timer should keep running continuously

  useEffect(() => {
    // Pre-fetch traits for first 24 valid cards (12 for player, 12 for AI)
    if (gamePhase === 'discard' && validCitizens.length >= 24) {
      setIsLoading(false)

      // Show discard message for 2 seconds - only once
      if (!discardMessageShown.current) {
        discardMessageShown.current = true
        setShowDiscardMessage(true)
        setTimeout(() => {
          setShowDiscardMessage(false)
        }, 2000)
      }

      validCitizens.slice(0, 24).forEach(card => {
        if (!citizenTraits[card.id]) {
          getTraitsForCitizen(card.id)
        }
      })
    }
  }, [validCitizens.length, gamePhase])

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

  // Keyboard navigation for battle phase
  useEffect(() => {
    if (selectedBattleCard === null || gamePhase !== 'battle') return

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
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedBattleCard, playerDeck, gamePhase])

  return (
    <div className="relative w-screen min-h-screen overflow-hidden flex flex-col items-center justify-start">
      <div
        className="absolute inset-0 bg-no-repeat bg-cover"
        style={{
          backgroundImage:
            "url('https://raw.githubusercontent.com/badfuture-926/neo-tokyo-card-clash/images/Neo%20Tokyo%20Card%20Clash%20Background.png')",
          backgroundPosition: "calc(50% + 40px) 15%",
        }}
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-black/40 to-black/80" />

      {/* Gold Targeting Line - connects battle card to hovered target card */}
      {isTargeting && hoveredTargetRect && (playerBattleCard || opponentBattleCard) && (
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
              // If player is targeting, draw from player card; if opponent is targeting, draw from opponent card
              const cardId = isPlayerTurn ? 'player-battle-card' : 'opponent-battle-card';
              const card = document.getElementById(cardId);
              if (card) {
                const rect = card.getBoundingClientRect();
                return rect.left + rect.width / 2;
              }
              return 0;
            })()}
            y1={(() => {
              const cardId = isPlayerTurn ? 'player-battle-card' : 'opponent-battle-card';
              const card = document.getElementById(cardId);
              if (card) {
                const rect = card.getBoundingClientRect();
                return rect.top + rect.height / 2;
              }
              return 0;
            })()}
            x2={hoveredTargetRect.x}
            y2={hoveredTargetRect.y}
            stroke="url(#goldLineGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            filter="url(#goldGlow)"
          />
        </svg>
      )}

      <h1 className="sr-only">Neo Tokyo Card Clash</h1>

      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen gap-8 p-4">
        {!gameStarted && (
          <>
            {showGameModes ? (
              <div className="flex flex-col items-center gap-8 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <button
                    className="btn-mode btn-mode-purple group"
                    onClick={() => startGameWithMode('omnipresent')}
                  >
                    <div className="type-title text-purple-400 group-hover:text-purple-300 transition-colors mb-2">Omnipresent</div>
                    <div className="type-body text-xs opacity-70 group-hover:opacity-100">Full battlefield awareness. All traits visible.</div>
                  </button>

                  <button
                    className="btn-mode btn-mode-blue group"
                    onClick={() => startGameWithMode('chaotic')}
                  >
                    <div className="type-title text-blue-400 group-hover:text-blue-300 transition-colors mb-2">Chaotic</div>
                    <div className="type-body text-xs opacity-70 group-hover:opacity-100">Limited intel phase. Strength is the only metric.</div>
                  </button>

                  <button
                    className="btn-mode btn-mode-red group"
                    onClick={() => startGameWithMode('threat-intelligence')}
                  >
                    <div className="type-title text-red-500 group-hover:text-red-400 transition-colors mb-2">Threat Intel</div>
                    <div className="type-body text-xs opacity-70 group-hover:opacity-100">Counter-ops. Blind defense mechanism active.</div>
                  </button>

                  <button
                    className="btn-mode btn-mode-orange group"
                    onClick={() => startGameWithMode('last-citizen-standing')}
                  >
                    <div className="type-title text-orange-400 group-hover:text-orange-300 transition-colors mb-2">Last Citizen</div>
                    <div className="type-body text-xs opacity-70 group-hover:opacity-100">Total attrition warfare. Eliminate all assets.</div>
                  </button>
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
                  <div className="type-meta text-[#0090ff]">v1.2.0</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-gray-400 leading-relaxed">
                  <div className="space-y-2">
                    <div className="text-white font-bold uppercase tracking-wider text-xs border-l-2 border-[#0090ff] pl-3">Deployment</div>
                    <p>Draw 12 Citizens from the Neo Tokyo distinct set. Discard the 3 weakest assets to optimize your hand. Enter combat with 9 elite units.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-white font-bold uppercase tracking-wider text-xs border-l-2 border-purple-500 pl-3">Engagement</div>
                    <p>Alternating turns. Attacker selects the active Trait to challenge. Defender must counter with superior stats or rarity.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-white font-bold uppercase tracking-wider text-xs border-l-2 border-red-500 pl-3">Victory</div>
                    <p>First operator to 5 points achieves dominance. Numeric traits compare values; String traits compare item rarity.</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Shared Top Right Timer & Turn - Stacked */}
        {((gamePhase === 'battle') || ((gamePhase === 'discard' || (isRefreshPhase && !playerRefreshDiscarded)) && validCitizens.length >= 24)) && (
          <div className="fixed top-8 right-8 z-[100] flex flex-col items-end gap-3 pointer-events-none">
            {/* Timer */}
            <div className="bg-black/80  border border-white/10 px-5 py-3 rounded-2xl shadow-lg shadow-black/20 min-w-[90px] text-center pointer-events-auto">
              <div className={`text-4xl font-light tracking-tighter leading-none ${timer <= 10 ? 'text-red-500 animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]'}`}>
                {timer}
              </div>
              <div className="text-[8px] uppercase tracking-widest text-white/30 mt-1 font-bold">Seconds</div>
            </div>

            {/* Turn Counter (Battle Only) */}
            {gameMode === 'last-citizen-standing' && gamePhase === 'battle' && (
              <div className="bg-black/80  border border-white/10 px-4 py-2 rounded-xl shadow-lg flex items-center justify-between gap-4 w-full pointer-events-auto">
                <span className="text-[10px] uppercase tracking-widest text-[#0090ff] font-bold">Turn</span>
                <span className="text-lg font-light text-white tabular-nums leading-none">{turnCount}</span>
              </div>
            )}
          </div>
        )}

        {gameStarted && (gamePhase === 'discard' || (isRefreshPhase && !playerRefreshDiscarded)) && (
          <>
            {/* Timer - Top Right Corner - Always Visible */}


            {validCitizens.length < 24 && (
              <div className="mt-36 text-center">
                <p className="text-2xl font-bold uppercase tracking-widest text-[#4db8ff] mb-4 animate-pulse">Drawing your 12...</p>
                <p className="text-lg font-bold uppercase tracking-widest text-purple-300">{validCitizens.length} / 24 loading (need 24 total)</p>
              </div>
            )}

            <div className="hidden">
              {citizens.map((card) => (
                <img key={card.id} src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${card.id}.png`} alt="" onLoad={() => handleImageLoad(card.id)} onError={() => handleImageError(card.id)} />
              ))}
            </div>

            {/* Discard Phase UI */}
            {(validCitizens.length >= 24 || (isRefreshPhase && !playerRefreshDiscarded)) && (
              <div className="mt-36 w-full max-w-7xl mx-auto px-4">
                {/* Big Gold "Discard 3 Cards" Message - Shows for 2 seconds */}
                {showDiscardMessage && (
                  <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                    <div className="text-8xl font-bold uppercase tracking-widest text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,1)] animate-fade-in-out">
                      DISCARD 3 CARDS
                    </div>
                  </div>
                )}

                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 transition-opacity duration-500 ${showDiscardMessage ? 'opacity-30' : 'opacity-100'}`}>
                  {(isRefreshPhase ? playerDeck : validCitizens.slice(0, 12).map((c: CitizenCard) => c.id)).map((cardId: number) => {
                    const isDiscarded = isRefreshPhase ? false : discardedCards.includes(cardId)
                    const isSelected = selectedForDiscard === cardId
                    return (
                      <div
                        key={cardId}
                        className={`bg-gray-900/70 border rounded-xl overflow-hidden shadow-lg transition-all duration-300 cursor-pointer ${isDiscarded ? 'opacity-30 border-red-600/40' : isSelected ? 'border-yellow-500 shadow-yellow-500/50 scale-105' : 'border-[#0077cc]/40 shadow-[#002244]/30 hover:border-yellow-500 hover:shadow-yellow-500/50 hover:scale-105'
                          }`}
                        onClick={() => !isDiscarded && setSelectedForDiscard(cardId)}
                      >
                        <img src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${cardId}.png`} alt={`Citizen ${cardId}`} className="w-full aspect-square object-cover" />
                        <p className="text-xl font-bold text-cyan-200 text-center py-3">#{cardId}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {selectedForDiscard !== null && (gamePhase === 'discard' || (isRefreshPhase && !playerRefreshDiscarded)) && !discardedCards.includes(selectedForDiscard) && (
          <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50 p-4" onClick={() => setSelectedForDiscard(null)}>
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
                  <button className="absolute top-2 right-3 text-[#4db8ff] text-2xl hover:text-white z-10 transition-colors" onClick={() => setSelectedForDiscard(null)}>×</button>
                  <h3 className="text-sm font-bold text-[#4db8ff] text-center pt-2 pb-1">Citizen #{selectedForDiscard}</h3>
                  <div className="w-full aspect-square bg-black flex items-center justify-center border-b-4 border-[#0055aa]/50">
                    <img src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${selectedForDiscard}.png`} alt={`Citizen #${selectedForDiscard}`} className="w-full h-full object-contain" />
                  </div>
                  <div className="p-4 space-y-2">
                    {(() => {
                      const traits = citizenTraits[selectedForDiscard!]
                      if (!traits) return <div className="text-white/50 text-center">Loading traits...</div>
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
                  DISCARD
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
              {/* Board overlay during targeting */}
              {isTargeting && (
                <div className="absolute inset-0 bg-black/85 z-[25] pointer-events-none transition-opacity duration-500 rounded-b-3xl" />
              )}
              {opponentDeck.map((cardId: string) => (
                <div
                  key={cardId}
                  className={`w-32 bg-gray-900/70 border-4 rounded-lg overflow-hidden shadow-lg transition-all duration-300 ${isTargeting ? 'cursor-pointer border-white/40 opacity-100 hover:border-red-500 hover:ring-4 hover:ring-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.8)] z-30' : 'border-red-600/20 opacity-40'
                    }`}
                  onClick={() => {
                    if (isTargeting) {
                      // Player chose their target! Open inspection modal.
                      setPendingTarget(cardId)
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (isTargeting) {
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
                </div>
              ))}
            </div>

            {/* Battle area - middle grid */}
            <div className="flex-1 relative z-10 grid grid-cols-12 px-12">

              {/* Left Column: Targeting Prompt, Operational Phase, Special Abilities */}
              <div className="col-span-3 flex flex-col items-start justify-center gap-8 pl-8 h-full">


                {isTargeting && !pendingTarget && (
                  <div className="fixed top-1/2 left-8 -translate-y-1/2 z-[50] bg-gray-900/90 border border-red-500/50  rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-left-4 duration-500 w-[240px]">
                    <div className="text-center">
                      <div className="text-red-400 text-[10px] font-black mb-2 uppercase tracking-widest opacity-70">Action Required</div>
                      <div className="text-3xl font-black text-white leading-none tracking-tighter">CHOOSE<br /><span className="text-red-500">TARGET</span></div>
                      <div className="text-[10px] font-bold mt-3 text-red-300/60 leading-tight">Identify the hostile citizen to initiate the clash</div>
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
                    {playerBattleCard ? (
                      <div className="relative border border-[#0090ff]/50 rounded-xl w-full h-full overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.15)] transition-all duration-500">
                        <img
                          src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${playerBattleCard}.png`}
                          alt="Your Card"
                          className="w-full h-full object-cover"
                        />
                        {/* Card number overlay */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                          <span className="text-[#0090ff] font-black text-lg tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">#{playerBattleCard}</span>
                        </div>

                        {gameMode === 'last-citizen-standing' && isTargeting && !pendingTarget && isPlayerTurn && (
                          <div className="absolute inset-0 bg-black/85 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center  cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); setPlayerBattleCard(null); setIsTargeting(false); }}
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
            <div className="fixed top-1/2 right-8 -translate-y-1/2 z-[50]">
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
            </div>

            {/* Overlays: Absolute within Grid Container */}
            {showBattleAnimation && (
              <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
                <div className="text-7xl font-black text-white italic tracking-tighter animate-clash-vibrate drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                  CLASH<span className="text-yellow-400">!</span>
                </div>
              </div>
            )}

            {battleResult && !gameOver && (
              <div className="absolute inset-0 z-[100] flex items-center justify-center  pointer-events-none">
                <div className={`px-12 py-10 rounded-[2rem] border shadow-2xl animate-in zoom-in duration-300  ${battleResult.winner === 'player' ? 'bg-black/85 border-[#0090ff]/30 shadow-[#0090ff]/10' : 'bg-black/85 border-red-500/30 shadow-red-500/10'}`}>
                  <div className="text-center">
                    <div className={`text-[10px] font-bold uppercase tracking-[0.4em] mb-3 ${battleResult.winner === 'player' ? 'text-[#0090ff]' : 'text-red-400'}`}>engagement outcome</div>
                    <div className="text-4xl md:text-5xl font-black text-white italic tracking-tighter mb-4 drop-shadow-lg">
                      {battleResult.winner === 'player' ? 'TARGET ELIMINATED' : 'UNIT LOST'}
                    </div>
                    <div className="text-white/60 font-medium text-sm max-w-xs mx-auto tracking-wide">{battleResult.message}</div>
                  </div>
                </div>
              </div>
            )}

            {/* CONFLICT MODAL - Steve Jobs Minimalist Redesign */}
            {pendingTarget && (playerBattleCard || opponentBattleCard) && !battleResult && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90  animate-in fade-in duration-300">
                <div className="relative w-full max-w-7xl mx-4 bg-[#050505] border border-white/10 rounded-[2rem] shadow-2xl p-10 flex flex-col items-center">

                  {/* Header: Minimalist & Clean */}
                  <div className="text-center mb-10">
                    <div className="text-white/40 text-[10px] font-bold uppercase tracking-[0.4em] mb-3">Conflict Initiated</div>
                    <div className="text-4xl md:text-5xl font-light tracking-tight text-white mb-2">
                      {isPlayerTurn ? 'CONFIRM ATTACK' : 'INCOMING ATTACK'}
                    </div>
                    {!isPlayerTurn && (
                      <div className="text-red-400/80 text-sm font-medium tracking-wide">Opponent is targeting your citizen</div>
                    )}
                  </div>

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
                            src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${isPlayerTurn ? playerBattleCard : opponentBattleCard}.png`}
                            alt="Attacker"
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                            <div className={`text-center font-bold text-lg tracking-widest ${isPlayerTurn ? 'text-[#0090ff]' : 'text-red-400'}`}>
                              #{isPlayerTurn ? playerBattleCard : opponentBattleCard}
                            </div>
                          </div>
                        </div>
                        <div className={`mt-4 text-xs font-bold tracking-widest uppercase ${isPlayerTurn ? 'text-[#0090ff]' : 'text-red-400'}`}>
                          {isPlayerTurn ? 'Attacker' : 'Enemy'}
                        </div>
                      </div>

                      {/* Traits Panel (Right of Card) */}
                      <div className="w-48 space-y-3">
                        {citizenTraits[isPlayerTurn ? playerBattleCard! : opponentBattleCard!] ? (
                          <>
                            {[
                              { label: 'Strength', val: citizenTraits[isPlayerTurn ? playerBattleCard! : opponentBattleCard!].strength },
                              { label: 'Intelligence', val: citizenTraits[isPlayerTurn ? playerBattleCard! : opponentBattleCard!].intelligence },
                              { label: 'Cool', val: citizenTraits[isPlayerTurn ? playerBattleCard! : opponentBattleCard!].cool },
                              { label: 'Tech Skill', val: citizenTraits[isPlayerTurn ? playerBattleCard! : opponentBattleCard!].techSkill },
                              { label: 'Attractiveness', val: citizenTraits[isPlayerTurn ? playerBattleCard! : opponentBattleCard!].attractiveness },
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
                                {citizenTraits[isPlayerTurn ? playerBattleCard! : opponentBattleCard!].rewardRate || '-'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-1 opacity-60">
                              <span className="text-xs uppercase tracking-wider text-white/40">Total Power</span>
                              <span className="text-sm font-medium text-white/60 tabular-nums">
                                {(citizenTraits[isPlayerTurn ? playerBattleCard! : opponentBattleCard!].strength || 0) +
                                  (citizenTraits[isPlayerTurn ? playerBattleCard! : opponentBattleCard!].intelligence || 0) +
                                  (citizenTraits[isPlayerTurn ? playerBattleCard! : opponentBattleCard!].cool || 0) +
                                  (citizenTraits[isPlayerTurn ? playerBattleCard! : opponentBattleCard!].techSkill || 0) +
                                  (citizenTraits[isPlayerTurn ? playerBattleCard! : opponentBattleCard!].attractiveness || 0)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-white/20 text-sm">Loading data...</div>
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
                      <div className="w-48 space-y-3 text-right">
                        {citizenTraits[pendingTarget] ? (
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
                        )}
                      </div>

                      {/* Card Display */}
                      {/* Card Display with Navigation Arrows */}
                      <div className="flex items-center gap-4">
                        {/* Left Arrow - Only for Attacker (Player Turn) and modifying Target */}
                        {isPlayerTurn && (
                          <button
                            className="text-[#0090ff] text-4xl hover:text-white hover:scale-110 transition-all font-bold opacity-50 hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentIndex = opponentDeck.findIndex(id => id === pendingTarget);
                              const prevIndex = currentIndex > 0 ? currentIndex - 1 : opponentDeck.length - 1;
                              setPendingTarget(opponentDeck[prevIndex]);
                            }}
                          >
                            ‹
                          </button>
                        )}

                        <div className="flex flex-col items-center">
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
                          <div className={`mt-4 text-xs font-bold tracking-widest uppercase ${isPlayerTurn ? 'text-red-400' : 'text-[#0090ff]'}`}>
                            {isPlayerTurn ? 'Target' : 'Defender'}
                          </div>
                        </div>

                        {/* Right Arrow - Only for Attacker (Player Turn) and modifying Target */}
                        {isPlayerTurn && (
                          <button
                            className="text-[#0090ff] text-4xl hover:text-white hover:scale-110 transition-all font-bold opacity-50 hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentIndex = opponentDeck.findIndex(id => id === pendingTarget);
                              const nextIndex = currentIndex < opponentDeck.length - 1 ? currentIndex + 1 : 0;
                              setPendingTarget(opponentDeck[nextIndex]);
                            }}
                          >
                            ›
                          </button>
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
                            setOpponentBattleCard(pendingTarget)
                            setPendingTarget(null)
                            setIsTargeting(false)
                            setHoveredTargetRect(null)
                            setShowBattleAnimation(true)
                            setTimeout(() => {
                              setShowBattleAnimation(false)
                              if (playerBattleCard && pendingTarget) {
                                const pTraits = citizenTraits[playerBattleCard]
                                const oTraits = citizenTraits[pendingTarget]
                                if (pTraits && oTraits) {
                                  const pTotal = (pTraits.strength || 0) + (pTraits.intelligence || 0) + (pTraits.cool || 0) + (pTraits.techSkill || 0) + (pTraits.attractiveness || 0)
                                  const oTotal = (oTraits.strength || 0) + (oTraits.intelligence || 0) + (oTraits.cool || 0) + (oTraits.techSkill || 0) + (oTraits.attractiveness || 0)
                                  const playerWins = pTotal >= oTotal
                                  setBattleResult({
                                    winner: playerWins ? 'player' : 'opponent',
                                    message: playerWins ? `Victory! Total power ${pTotal} > ${oTotal}` : `Defeat. Total power ${pTotal} < ${oTotal}`
                                  })
                                  if (playerWins) {
                                    setPlayerScore(prev => prev + 1)
                                    setOpponentDeck(prev => prev.filter((id: string) => id !== pendingTarget))
                                  } else {
                                    setOpponentScore(prev => prev + 1)
                                    setPlayerDeck(prev => prev.filter((id: string) => id !== playerBattleCard))
                                  }
                                }
                              }
                            }, 1500)
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
            )}
            {/* End Grid Container (L1499 actually ended here if we want overlays inside, or sibling is fine) */}
            {/* I'll let L1586 close L1499 and keep these as siblings within L1421 */}



            {/* Opponent Summon Buttons - Mirrored at Top */}
            {gameMode === 'last-citizen-standing' && !isTargeting && (
              <div className="fixed top-[150px] left-0 right-0 z-[60] flex justify-center items-center pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-4 opacity-40">

                  {/* Dark Lord (Opponent) */}
                  <div className="group relative flex flex-col items-center">
                    <div className="w-20 h-20 rounded-[1.2rem] overflow-hidden border border-white/10 shadow-lg transition-all duration-300 relative bg-black/80 z-10">
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
                  <div className="group relative flex flex-col items-center">
                    <div className="w-20 h-20 rounded-[1.2rem] overflow-hidden border border-white/10 shadow-lg transition-all duration-300 relative bg-black/70 z-10">
                      <img src="https://neotokyo.codes/assets/img/Ar3mt.png" alt="Angie" className="w-full h-full object-contain p-1 opacity-90" />
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
                  <div className="group relative flex flex-col items-center">
                    <div className="w-20 h-20 rounded-[1.2rem] overflow-hidden border border-white/10 shadow-lg transition-all duration-300 relative bg-black/80 z-10">
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
            )}

            {/* Summon Buttons - Apple-style Floating Design */}
            {gameMode === 'last-citizen-standing' && !isTargeting && (
              <div className="fixed bottom-[150px] left-0 right-0 z-[60] flex justify-center items-center pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-4">

                  {/* Dark Lord */}
                  <div className="group relative flex flex-col items-center cursor-pointer" onClick={() => setShowDarkLordSelection(true)}>
                    <div className="w-20 h-20 rounded-[1.2rem] overflow-hidden border border-white/10 group-hover:border-purple-500/50 shadow-lg group-hover:shadow-[0_0_35px_rgba(168,85,247,0.5)] transition-all duration-300 relative bg-black/80 group-hover:scale-110 ease-out z-10">
                      <img src="https://pbs.twimg.com/tweet_video_thumb/FSRyHOVXIAAQP3M.jpg" alt="Dark Lord" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-20">
                      <div className="bg-black/80  px-4 py-1.5 rounded-full border border-purple-500/30 text-purple-200 text-[10px] font-bold uppercase tracking-widest shadow-xl">
                        Summon Dark Lord
                      </div>
                      <div className="w-2 h-2 bg-black/80 border-r border-b border-purple-500/30 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                    </div>
                  </div>

                  {/* Angie */}
                  <div className="group relative flex flex-col items-center cursor-pointer" onClick={() => { /* generic */ }}>
                    <div className="w-20 h-20 rounded-[1.2rem] overflow-hidden border border-white/10 group-hover:border-yellow-500/50 shadow-lg group-hover:shadow-[0_0_35px_rgba(234,179,8,0.5)] transition-all duration-300 relative bg-black/70 group-hover:scale-110 ease-out z-10">
                      <img src="https://neotokyo.codes/assets/img/Ar3mt.png" alt="Angie" className="w-full h-full object-contain p-1 opacity-90 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-20">
                      <div className="bg-black/80  px-4 py-1.5 rounded-full border border-yellow-500/30 text-yellow-200 text-[10px] font-bold uppercase tracking-widest shadow-xl">
                        Summon Angie
                      </div>
                      <div className="w-2 h-2 bg-black/80 border-r border-b border-yellow-500/30 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                    </div>
                  </div>

                  {/* Angelic Overlord */}
                  <div className="group relative flex flex-col items-center cursor-pointer" onClick={() => setShowAngelicSelection(true)}>
                    <div className="w-20 h-20 rounded-[1.2rem] overflow-hidden border border-white/10 group-hover:border-blue-500/50 shadow-lg group-hover:shadow-[0_0_35px_rgba(59,130,246,0.5)] transition-all duration-300 relative bg-black/80 group-hover:scale-110 ease-out z-10">
                      <img src="https://neotokyo.codes/_next/image?url=https%3A%2F%2Fneo-tokyo.nyc3.cdn.digitaloceanspaces.com%2Fs1Citizen%2Fpngs%2F2350.png&w=1920&q=75" alt="Angelic" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-20">
                      <div className="bg-black/80  px-4 py-1.5 rounded-full border border-blue-500/30 text-blue-200 text-[10px] font-bold uppercase tracking-widest shadow-xl">
                        Summon Angelic Overlord
                      </div>
                      <div className="w-2 h-2 bg-black/80 border-r border-b border-blue-500/30 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                    </div>
                  </div>

                </div>
              </div>
            )}

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

                return (
                  <div
                    key={cardId}
                    data-card-id={cardId}
                    className={`w-32 bg-gray-900/70 border rounded-lg overflow-hidden shadow-lg transition-all ${
                      // Disable if: targeting mode OR (not player turn AND NOT refresh phase)
                      gameMode === 'last-citizen-standing' && (isTargeting || (!isPlayerTurn && !isRefreshPhase)) ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
                      } ${selectedBattleCard === cardId ? 'border-[#0090ff] shadow-[#0090ff]/50' : `border-[#0077cc]/40 ${isPlayerTurn || isRefreshPhase ? 'hover:border-yellow-500 hover:shadow-yellow-500/50' : ''}`}`}
                    onMouseEnter={() => {
                      // Clear any pending timeout when entering a new card
                      if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                        hoverTimeoutRef.current = null;
                      }

                      // CRITICAL: Disable hover when it's not the player's turn
                      if (!isPlayerTurn) return;
                      // Disable during conflict phases
                      if (gamePhase === 'conflict-initiated' || gamePhase === 'conflict-resolution') return;
                      // Disable when player has a card on the battlefield (during clash)
                      if (playerBattleCard) return;
                      setHoveredDeckCard(cardId);
                      getTraitsForCitizen(cardId);
                    }}
                    onMouseLeave={() => {
                      // Set a 200ms delay before clearing the hover
                      hoverTimeoutRef.current = setTimeout(() => {
                        setHoveredDeckCard(null);
                        hoverTimeoutRef.current = null;
                      }, 200);
                    }}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();

                      // Clear timeout and hide immediately on click
                      if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                        hoverTimeoutRef.current = null;
                      }
                      setHoveredDeckCard(null);


                      // Handling Discard Selection in Refresh Phase
                      if (gameMode === 'last-citizen-standing' && isRefreshPhase) {
                        setSelectedForDiscard(cardId);
                        return;
                      }

                      if (gameMode === 'last-citizen-standing' && (isTargeting || !isPlayerTurn)) return;

                      setHoveredDeckCard(null);
                      setPlayerBattleCard(cardId);
                      setIsTargeting(true);
                      setSelectedBattleCard(null);
                      setSelectedTrait(null);
                      setSelectedSecondTrait(null);
                    }}
                  >
                    <img src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${cardId}.png`} alt={`Citizen ${cardId}`} className="w-full aspect-square object-cover" />
                  </div>
                )
              })}
            </div>

            {gameOver && (
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
            )}
          </div>
        )}

        {hoveredDeckCard && (
          <div className="fixed inset-0 pointer-events-none z-[150] flex items-center justify-center p-4 bg-black/80 ">
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

                  const availableTraits = getAvailableTraits()

                  return (
                    <div className={`grid ${gameMode === 'last-citizen-standing' ? 'grid-cols-3' :
                      gameMode === 'chaotic' || gameMode === 'threat-intelligence' ? 'grid-cols-3' :
                        'grid-cols-4'
                      } gap-1 text-center`}>
                      {availableTraits.map(({ label, value: traitKey, key }) => {
                        const value = traits[traitKey as keyof CitizenTraits]
                        return (
                          <div key={label} className="bg-gray-800/70 border border-[#0055aa]/40 rounded p-1 h-[45px] flex flex-col justify-center opacity-90 transition-all">
                            <div className="text-[#0090ff] font-semibold leading-tight text-[8px] tracking-tighter uppercase">{label}</div>
                            <div className={`text-[12px] font-bold leading-tight overflow-hidden text-ellipsis line-clamp-2 ${isUltraRareTrait(key, value) ? 'text-yellow-400' : isRareTrait(key, value) ? 'text-purple-300' : 'text-white/90'}`}>
                              {value}
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
        )}
      </div>
    </div >
  )
}

export default App