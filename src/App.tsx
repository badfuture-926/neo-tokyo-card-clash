import { useState, useEffect, useRef } from 'react'
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
  const [gameMode, setGameMode] = useState<'omnipresent' | 'chaotic' | 'threat-intelligence' | null>(null)
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
  const [playerBattleCard, setPlayerBattleCard] = useState<number | null>(null)
  const [playerSelectedTrait, setPlayerSelectedTrait] = useState<string | null>(null)
  const [opponentBattleCard, setOpponentBattleCard] = useState<number | null>(null)
  const [opponentSelectedTrait, setOpponentSelectedTrait] = useState<string | null>(null)
  
  // Game state
  const [playerScore, setPlayerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [battleResult, setBattleResult] = useState<{ winner: 'player' | 'opponent', message: string } | null>(null)
  const [showBattleAnimation, setShowBattleAnimation] = useState(false)
  const [gameOver, setGameOver] = useState<'win' | 'lose' | null>(null)

  const startGame = () => {
    setShowGameModes(true)
  }

  const startGameWithMode = (mode: 'omnipresent' | 'chaotic' | 'threat-intelligence') => {
    setGameMode(mode)
    setShowGameModes(false)
    setIsLoading(true)
    setGameStarted(true)
    setGamePhase('discard')
    setDiscardedCards([])
    setTimer(30)
    discardMessageShown.current = false
    
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
      const newDiscarded = [...discardedCards, selectedForDiscard]
      setDiscardedCards(newDiscarded)
      
      // Auto-navigate to next available card
      if (newDiscarded.length < 3) {
        const availableCards = validCitizens.slice(0, 12).filter(c => !newDiscarded.includes(c.id))
        const currentIndex = availableCards.findIndex(c => c.id === selectedForDiscard)
        // Go to next card, or wrap to first if at end
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
        
        switch(traitType) {
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
    const availableCards = opponentDeck.filter(id => id !== opponentBattleCard)
    
    // Analyze cards and choose strategy
    const cardAnalysis = availableCards.map(cardId => {
      const traits = citizenTraits[cardId]
      if (!traits) return { cardId, score: 0, traitValue: 0 as string | number, cardPower: 0 }
      
      // Extract trait category and value from attacking trait string
      const traitParts = attackingTrait.split(': ')
      const traitCategory = traitParts[0]
      
      let traitValue: string | number = 0
      switch(traitCategory) {
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
        return cardAnalysis[0].cardId
      }
    } else {
      // AI is attacking - choose strongest card
      cardAnalysis.sort((a, b) => b.cardPower - a.cardPower)
      const strongestCard = cardAnalysis[0]
      return strongestCard.cardId
    }
  }

  // Execute battle when both cards are placed
  useEffect(() => {
    if (playerBattleCard && opponentBattleCard && playerSelectedTrait && opponentSelectedTrait && !battleResult) {
      // Trigger battle animation
      setShowBattleAnimation(true)
      
      setTimeout(() => {
        // Get trait category from player (always has full info)
        const playerTraitParts = playerSelectedTrait.split(': ')
        const traitCategory = playerTraitParts[0]
        
        // Get ACTUAL trait values from the cards' traits (not from the display strings)
        const playerTraits = citizenTraits[playerBattleCard]
        const opponentTraits = citizenTraits[opponentBattleCard]
        
        if (!playerTraits || !opponentTraits) return
        
        // Extract actual values based on trait category
        let playerValue: string | number = ''
        let opponentValue: string | number = ''
        
        switch(traitCategory) {
          case 'Class': 
            playerValue = playerTraits.class
            opponentValue = opponentTraits.class
            break
          case 'Race': 
            playerValue = playerTraits.race
            opponentValue = opponentTraits.race
            break
          case 'Eyes': 
            playerValue = playerTraits.eyes
            opponentValue = opponentTraits.eyes
            break
          case 'Location': 
            playerValue = playerTraits.location
            opponentValue = opponentTraits.location
            break
          case 'Item': 
            playerValue = playerTraits.additionalItem
            opponentValue = opponentTraits.additionalItem
            break
          case 'Weapon': 
            playerValue = playerTraits.weapon
            opponentValue = opponentTraits.weapon
            break
          case 'Vehicle': 
            playerValue = playerTraits.vehicle
            opponentValue = opponentTraits.vehicle
            break
          case 'Apparel': 
            playerValue = playerTraits.apparel
            opponentValue = opponentTraits.apparel
            break
          case 'Helm': 
            playerValue = playerTraits.helm
            opponentValue = opponentTraits.helm
            break
          case 'Reward': 
            playerValue = playerTraits.rewardRate
            opponentValue = opponentTraits.rewardRate
            break
          case 'Ability': 
            playerValue = playerTraits.ability
            opponentValue = opponentTraits.ability
            break
          case 'Strength': 
            playerValue = playerTraits.strength
            opponentValue = opponentTraits.strength
            break
          case 'Intelligence': 
            playerValue = playerTraits.intelligence
            opponentValue = opponentTraits.intelligence
            break
          case 'Cool': 
            playerValue = playerTraits.cool
            opponentValue = opponentTraits.cool
            break
          case 'Tech Skill': 
            playerValue = playerTraits.techSkill
            opponentValue = opponentTraits.techSkill
            break
          case 'Attractiveness': 
            playerValue = playerTraits.attractiveness
            opponentValue = opponentTraits.attractiveness
            break
        }
        
        // Update opponent's displayed trait to show actual value (reveal the ???)
        if (gameMode === 'threat-intelligence' && opponentSelectedTrait.includes('???')) {
          setOpponentSelectedTrait(`${traitCategory}: ${opponentValue}`)
        }
        
        let winner: 'player' | 'opponent'
        let message: string
        
        // Compare values
        if (typeof playerValue === 'number' && typeof opponentValue === 'number') {
          // Numeric comparison
          if (playerValue > opponentValue) {
            winner = 'player'
            message = `${traitCategory} ${playerValue} Beats ${traitCategory} ${opponentValue}`
          } else if (playerValue < opponentValue) {
            winner = 'opponent'
            message = `${traitCategory} ${opponentValue} Beats ${traitCategory} ${playerValue}`
          } else {
            // Tie - defender wins
            winner = isPlayerTurn ? 'opponent' : 'player'
            message = `${traitCategory} Tie! Defender wins`
          }
        } else {
          // Non-numeric - compare by actual rarity count (LOWER count = RARER = WINS)
          // EXCEPT for Reward Rate where HIGHER number is better
          
          if (traitCategory === 'Reward') {
            // Reward Rate: Higher number is better (1 < 2 < 3)
            const playerNum = parseFloat(String(playerValue))
            const opponentNum = parseFloat(String(opponentValue))
            
            if (!isNaN(playerNum) && !isNaN(opponentNum)) {
              if (playerNum > opponentNum) {
                winner = 'player'
                message = `${traitCategory}: ${playerValue} Beats ${opponentValue} (Higher is better)`
              } else if (opponentNum > playerNum) {
                winner = 'opponent'
                message = `${traitCategory}: ${opponentValue} Beats ${playerValue} (Higher is better)`
              } else {
                winner = isPlayerTurn ? 'opponent' : 'player'
                message = `${traitCategory}: Tie! Defender wins`
              }
            } else {
              // Fallback if not numbers
              winner = isPlayerTurn ? 'opponent' : 'player'
              message = `${traitCategory}: ${playerValue} vs ${opponentValue} - Defender wins`
            }
          } else {
            // Normal rarity comparison for all other string traits
            const traitKey = getTraitKey(traitCategory)
            const playerCount = getTraitCount(traitKey, playerValue)
            const opponentCount = getTraitCount(traitKey, opponentValue)
            
            console.log(`Battle: ${traitCategory} (key: ${traitKey}) | Player: ${playerValue} (count: ${playerCount}) vs Opponent: ${opponentValue} (count: ${opponentCount})`)
            
            if (playerCount < opponentCount) {
              // Player has rarer trait (lower count) - player wins
              winner = 'player'
              // Only show counts if both are rare (not common/9999)
              if (playerCount < 9999 && opponentCount < 9999) {
                message = `${traitCategory}: ${playerValue} (${playerCount}) Beats ${opponentValue} (${opponentCount})`
              } else if (playerCount < 9999) {
                message = `${traitCategory}: ${playerValue} (Rare) Beats ${opponentValue}`
              } else {
                message = `${traitCategory}: ${playerValue} Beats ${opponentValue}`
              }
            } else if (opponentCount < playerCount) {
              // Opponent has rarer trait (lower count) - opponent wins
              winner = 'opponent'
              // Only show counts if both are rare (not common/9999)
              if (playerCount < 9999 && opponentCount < 9999) {
                message = `${traitCategory}: ${opponentValue} (${opponentCount}) Beats ${playerValue} (${playerCount})`
              } else if (opponentCount < 9999) {
                message = `${traitCategory}: ${opponentValue} (Rare) Beats ${playerValue}`
              } else {
                message = `${traitCategory}: ${opponentValue} Beats ${playerValue}`
              }
            } else {
              // Same count - defender wins
              winner = isPlayerTurn ? 'opponent' : 'player'
              if (playerCount < 9999) {
                message = `${traitCategory}: Tie (both ${playerCount})! Defender wins`
              } else {
                message = `${traitCategory}: Tie! Defender wins`
              }
            }
          }
        }
        
        setBattleResult({ winner, message })
        setShowBattleAnimation(false)
        
        // Update score
        if (winner === 'player') {
          const newScore = playerScore + 1
          setPlayerScore(newScore)
          // Delay game over screen so battle result shows first
          if (newScore >= 5) {
            setTimeout(() => setGameOver('win'), 3000)
          }
        } else {
          const newScore = opponentScore + 1
          setOpponentScore(newScore)
          // Delay game over screen so battle result shows first
          if (newScore >= 5) {
            setTimeout(() => setGameOver('lose'), 3000)
          }
        }
        
        // Remove used cards from decks
        setPlayerDeck(prev => prev.filter(id => id !== playerBattleCard))
        setOpponentDeck(prev => prev.filter(id => id !== opponentBattleCard))
        
        // Clear battle after delay (only if game not over)
        setTimeout(() => {
          if ((winner === 'player' ? playerScore + 1 : playerScore) < 5 && 
              (winner === 'opponent' ? opponentScore + 1 : opponentScore) < 5) {
            setBattleResult(null)
            setPlayerBattleCard(null)
            setPlayerSelectedTrait(null)
            setOpponentBattleCard(null)
            setOpponentSelectedTrait(null)
            // Simply alternate turns every round
            setIsPlayerTurn(!isPlayerTurn)
            setTimer(30) // Reset timer for next turn
          }
        }, 3000)
      }, 1500) // Battle animation duration
    }
  }, [playerBattleCard, opponentBattleCard, playerSelectedTrait, opponentSelectedTrait])

  // AI responds after player attacks
  useEffect(() => {
    if (playerBattleCard && playerSelectedTrait && !opponentBattleCard && isPlayerTurn) {
      setTimeout(() => {
        const traitParts = playerSelectedTrait.split(': ')
        const traitCategory = traitParts[0]
        const traitValue = traitParts[1]
        const aiCardId = aiChooseCard(playerSelectedTrait, traitValue, true)
        
        // Get AI card's actual trait value for the same category
        const aiTraits = citizenTraits[aiCardId]
        if (aiTraits) {
          let aiTraitValue: string | number = ''
          switch(traitCategory) {
            case 'Class': aiTraitValue = aiTraits.class; break
            case 'Race': aiTraitValue = aiTraits.race; break
            case 'Eyes': aiTraitValue = aiTraits.eyes; break
            case 'Location': aiTraitValue = aiTraits.location; break
            case 'Item': aiTraitValue = aiTraits.additionalItem; break
            case 'Weapon': aiTraitValue = aiTraits.weapon; break
            case 'Vehicle': aiTraitValue = aiTraits.vehicle; break
            case 'Apparel': aiTraitValue = aiTraits.apparel; break
            case 'Helm': aiTraitValue = aiTraits.helm; break
            case 'Reward': aiTraitValue = aiTraits.rewardRate; break
            case 'Ability': aiTraitValue = aiTraits.ability; break
            case 'Strength': aiTraitValue = aiTraits.strength; break
            case 'Intelligence': aiTraitValue = aiTraits.intelligence; break
            case 'Cool': aiTraitValue = aiTraits.cool; break
            case 'Tech Skill': aiTraitValue = aiTraits.techSkill; break
            case 'Attractiveness': aiTraitValue = aiTraits.attractiveness; break
          }
          
          setOpponentBattleCard(aiCardId)
          // Store the actual value for later use
          const actualTraitValue = `${traitCategory}: ${aiTraitValue}`
          
          // In Threat Intelligence mode, show trait category but hide value until defense is placed
          if (gameMode === 'threat-intelligence') {
            setOpponentSelectedTrait(`${traitCategory}: ???`)
            // Store actual value in a way that battle resolution can access it
            // We'll reveal it when both cards are placed
            setTimeout(() => {
              // Reveal the value after a moment (when battle is about to resolve)
              setOpponentSelectedTrait(actualTraitValue)
            }, 1500)
          } else {
            setOpponentSelectedTrait(actualTraitValue)
          }
        }
      }, 1000)
    }
  }, [playerBattleCard, playerSelectedTrait, isPlayerTurn, gameMode])

  // AI attacks first on opponent's turn
  useEffect(() => {
    if (!isPlayerTurn && !opponentBattleCard && gamePhase === 'battle' && !battleResult) {
      setTimeout(() => {
        const aiCardId = aiChooseCard('', '', false)
        const aiTraits = citizenTraits[aiCardId]
        
        if (aiTraits) {
          let bestTrait
          
          if (gameMode === 'chaotic' || gameMode === 'threat-intelligence') {
            // In Chaotic and Threat Intelligence modes, AI chooses from all 12 available traits
            // Need to evaluate both numeric (Strength) and string traits (rarity-based)
            const availableTraits = getAvailableTraits()
            
            let bestScore = -Infinity
            let bestTraitChoice: { label: string, value: string | number } = { label: 'Strength', value: aiTraits.strength }
            
            availableTraits.forEach(({ label, value: traitKey }) => {
              const traitValue = aiTraits[traitKey as keyof CitizenTraits]
              
              // Score numeric traits by their value
              if (typeof traitValue === 'number') {
                if (traitValue > bestScore) {
                  bestScore = traitValue
                  bestTraitChoice = { label, value: traitValue }
                }
              } else {
                // Score string traits by rarity (lower count = rarer = better)
                // Ultra rare (gold) = high score, rare (purple) = medium score, common = low score
                const score = isUltraRareTrait(label, traitValue) ? 1000 :
                             isRareTrait(label, traitValue) ? 500 : 100
                if (score > bestScore) {
                  bestScore = score
                  bestTraitChoice = { label, value: traitValue }
                }
              }
            })
            
            bestTrait = bestTraitChoice
          } else {
            // In Omnipresent mode, AI chooses best numeric trait
            const traits = [
              { label: 'Strength', value: aiTraits.strength },
              { label: 'Intelligence', value: aiTraits.intelligence },
              { label: 'Cool', value: aiTraits.cool },
              { label: 'Tech Skill', value: aiTraits.techSkill },
              { label: 'Attractiveness', value: aiTraits.attractiveness }
            ]
            traits.sort((a, b) => b.value - a.value)
            bestTrait = traits[0]
          }
          
          setOpponentBattleCard(aiCardId)
          const actualTraitValue = `${bestTrait.label}: ${bestTrait.value}`
          
          // In Threat Intelligence mode, show trait category but hide value
          if (gameMode === 'threat-intelligence') {
            setOpponentSelectedTrait(`${bestTrait.label}: ???`)
            // Reveal value after player defends (when both cards are placed)
          } else {
            setOpponentSelectedTrait(actualTraitValue)
          }
          setTimer(30)
        }
      }, 2000)
    }
  }, [isPlayerTurn, opponentBattleCard, gamePhase, battleResult, gameMode])

  // Timer countdown
  useEffect(() => {
    if (!gameStarted) return
    if (gamePhase === 'discard' && validCitizens.length < 24) return
    if (gamePhase === 'battle' && playerBattleCard !== null) return // Stop timer when card is in battle
    
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1)
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
      } else if (gamePhase === 'battle' && !playerBattleCard) {
        // Timer expired - force player to make a move
        const availableCards = playerDeck.filter(id => id !== playerBattleCard)
        if (availableCards.length > 0) {
          const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)]
          const cardTraits = citizenTraits[randomCard]
          
          if (cardTraits) {
            if (isPlayerTurn) {
              // Player's turn to attack - choose random trait from available traits
              const availableTraits = getAvailableTraits()
              const randomTraitIndex = Math.floor(Math.random() * availableTraits.length)
              const randomTrait = availableTraits[randomTraitIndex]
              const traitValue = cardTraits[randomTrait.value as keyof CitizenTraits]
              
              // Execute attack
              setPlayerBattleCard(randomCard)
              setPlayerSelectedTrait(`${randomTrait.label}: ${traitValue}`)
              console.log('Timer expired - auto-attacking with:', randomCard, randomTrait.label)
            } else {
              // Player's turn to defend - use the trait opponent is attacking with
              if (opponentSelectedTrait) {
                const opponentTraitCategory = opponentSelectedTrait.split(': ')[0]
                let playerTraitValue: string | number = ''
                
                switch(opponentTraitCategory) {
                  case 'Class': playerTraitValue = cardTraits.class; break
                  case 'Race': playerTraitValue = cardTraits.race; break
                  case 'Eyes': playerTraitValue = cardTraits.eyes; break
                  case 'Location': playerTraitValue = cardTraits.location; break
                  case 'Item': playerTraitValue = cardTraits.additionalItem; break
                  case 'Weapon': playerTraitValue = cardTraits.weapon; break
                  case 'Vehicle': playerTraitValue = cardTraits.vehicle; break
                  case 'Apparel': playerTraitValue = cardTraits.apparel; break
                  case 'Helm': playerTraitValue = cardTraits.helm; break
                  case 'Reward': playerTraitValue = cardTraits.rewardRate; break
                  case 'Ability': playerTraitValue = cardTraits.ability; break
                  case 'Strength': playerTraitValue = cardTraits.strength; break
                  case 'Intelligence': playerTraitValue = cardTraits.intelligence; break
                  case 'Cool': playerTraitValue = cardTraits.cool; break
                  case 'Tech Skill': playerTraitValue = cardTraits.techSkill; break
                  case 'Attractiveness': playerTraitValue = cardTraits.attractiveness; break
                }
                
                // Execute defense
                setPlayerBattleCard(randomCard)
                setPlayerSelectedTrait(`${opponentTraitCategory}: ${playerTraitValue}`)
                console.log('Timer expired - auto-defending with:', randomCard, opponentTraitCategory)
                
                // Reveal opponent's value in Threat Intelligence mode
                if (gameMode === 'threat-intelligence' && opponentSelectedTrait.includes('???')) {
                  const opponentTraits = citizenTraits[opponentBattleCard!]
                  if (opponentTraits) {
                    let opponentActualValue: string | number = ''
                    switch(opponentTraitCategory) {
                      case 'Class': opponentActualValue = opponentTraits.class; break
                      case 'Race': opponentActualValue = opponentTraits.race; break
                      case 'Eyes': opponentActualValue = opponentTraits.eyes; break
                      case 'Location': opponentActualValue = opponentTraits.location; break
                      case 'Item': opponentActualValue = opponentTraits.additionalItem; break
                      case 'Weapon': opponentActualValue = opponentTraits.weapon; break
                      case 'Vehicle': opponentActualValue = opponentTraits.vehicle; break
                      case 'Apparel': opponentActualValue = opponentTraits.apparel; break
                      case 'Helm': opponentActualValue = opponentTraits.helm; break
                      case 'Reward': opponentActualValue = opponentTraits.rewardRate; break
                      case 'Ability': opponentActualValue = opponentTraits.ability; break
                      case 'Strength': opponentActualValue = opponentTraits.strength; break
                      case 'Intelligence': opponentActualValue = opponentTraits.intelligence; break
                      case 'Cool': opponentActualValue = opponentTraits.cool; break
                      case 'Tech Skill': opponentActualValue = opponentTraits.techSkill; break
                      case 'Attractiveness': opponentActualValue = opponentTraits.attractiveness; break
                    }
                    setOpponentSelectedTrait(`${opponentTraitCategory}: ${opponentActualValue}`)
                  }
                }
              }
            }
          }
        }
      }
    }
  }, [timer, gameStarted, gamePhase, validCitizens, discardedCards, playerBattleCard, playerDeck, citizenTraits])

  useEffect(() => {
    if (gamePhase === 'battle' && playerBattleCard === null) {
      setTimer(30)
    }
  }, [gamePhase, playerBattleCard])

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
      const availableCards = validCitizens.slice(0, 12).filter(c => !discardedCards.includes(c.id))
      const currentIndex = availableCards.findIndex(c => c.id === selectedForDiscard)
      
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
      const currentIndex = playerDeck.findIndex(id => id === selectedBattleCard)
      
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
      <h1 className="sr-only">Neo Tokyo Card Clash</h1>

      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen gap-8">
        {!gameStarted && (
          <>
            {showGameModes ? (
              <div className="flex flex-col items-center gap-8">
                <div className="flex flex-col gap-6">
                  <button
                    className="px-16 py-8 text-3xl font-bold text-white bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl shadow-2xl shadow-purple-500/50 hover:shadow-purple-400/80 hover:scale-105 transition-all duration-300 border-2 border-purple-400"
                    onClick={() => startGameWithMode('omnipresent')}
                  >
                    <div className="text-4xl mb-2">🔮 Omnipresent</div>
                    <div className="text-sm text-purple-200">See all traits, choose your strategy</div>
                  </button>
                  
                  <button
                    className="px-16 py-8 text-3xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-2xl shadow-blue-500/50 hover:shadow-blue-400/80 hover:scale-105 transition-all duration-300 border-2 border-blue-400"
                    onClick={() => startGameWithMode('chaotic')}
                  >
                    <div className="text-4xl mb-2">🌀 Chaotic</div>
                    <div className="text-sm text-blue-200">12 traits, Strength is the only number</div>
                  </button>
                  
                  <button
                    className="px-16 py-8 text-3xl font-bold text-white bg-gradient-to-r from-red-600 to-red-800 rounded-xl shadow-2xl shadow-red-500/50 hover:shadow-red-400/80 hover:scale-105 transition-all duration-300 border-2 border-red-400"
                    onClick={() => startGameWithMode('threat-intelligence')}
                  >
                    <div className="text-4xl mb-2">🎯 Threat Intelligence</div>
                    <div className="text-sm text-red-200">Predict and counter opponent moves</div>
                  </button>
                  
                  <button
                    className="mt-4 px-8 py-3 text-lg text-gray-400 hover:text-white transition-colors"
                    onClick={() => setShowGameModes(false)}
                  >
                    ← Back
                  </button>
                </div>
              </div>
            ) : !isLoading ? (
              <div className="flex flex-col gap-6">
                <button
                  className="px-12 py-6 text-3xl font-bold text-black bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-400/80 hover:scale-105 transition-all duration-300"
                  onClick={startGame}
                >
                  Play Vs AI
                </button>
                <button
                  className="px-12 py-6 text-3xl font-bold text-gray-400 bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl shadow-2xl shadow-gray-700/50 hover:shadow-gray-600/80 transition-all duration-300 cursor-not-allowed group relative"
                  disabled
                >
                  <span className="group-hover:opacity-0 transition-opacity duration-300">Play Vs a Friend</span>
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-yellow-400">Coming Soon</span>
                </button>
                <button
                  className="px-12 py-4 text-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-2xl shadow-blue-500/50 hover:shadow-blue-400/80 hover:scale-105 transition-all duration-300"
                  onClick={() => setShowRules(!showRules)}
                >
                  {showRules ? 'Hide Rules' : 'Game Rules'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="text-4xl font-bold text-cyan-400 animate-pulse">Loading Cards...</div>
                <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 animate-pulse w-full"></div>
                </div>
              </div>
            )}

            {showRules && (
              <div className="mt-3 bg-gray-900/95 border-4 border-cyan-600 rounded-2xl p-4 max-w-4xl shadow-2xl shadow-cyan-700/50">
                <h2 className="text-xl font-bold text-cyan-400 mb-2 text-center">Neo Tokyo Card Clash</h2>
                
                <div className="text-white text-[11px] space-y-1 leading-tight">
                  <div><span className="text-cyan-400 font-bold">Setup:</span> Draw 12 random Citizens → Discard 3 weakest → Battle with 9 cards (one-use each)</div>
                  <div><span className="text-cyan-400 font-bold">Battle:</span> Alternating attacker/defender turns. First to 5 points wins.</div>
                  <div><span className="text-cyan-400 font-bold">Resolution:</span> Attacker picks trait. Both cards compared on that trait. Winner gets +1 point.</div>
                  
                  <div className="flex gap-2 text-[10px] mt-1">
                    <div className="flex-1">
                      <span className="text-purple-300 font-semibold">Numeric:</span> Higher value wins (STR 92 &gt; STR 82)
                    </div>
                    <div className="flex-1">
                      <span className="text-purple-300 font-semibold">String:</span> Rarer wins (Sword (1) &gt; Sock (38))
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-cyan-600/40 mt-2 pt-2">
                  <div className="text-cyan-300 font-bold text-xs mb-1.5">GAME MODES:</div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div className="bg-purple-900/20 border border-purple-500/40 rounded p-2">
                      <div className="text-purple-400 font-bold text-xs mb-1">🔮 OMNIPRESENT</div>
                      <div className="leading-snug">Full intel. See all 16 traits and exact values on every card.</div>
                    </div>
                    <div className="bg-blue-900/20 border border-blue-500/40 rounded p-2">
                      <div className="text-blue-400 font-bold text-xs mb-1">🌀 CHAOTIC</div>
                      <div className="leading-snug">Only 12 traits. Strength is the ONLY numeric trait. See all values.</div>
                    </div>
                    <div className="bg-red-900/20 border border-red-500/40 rounded p-2">
                      <div className="text-red-400 font-bold text-xs mb-1">🎯 THREAT INTEL</div>
                      <div className="leading-snug">Only 12 traits. Blind defense. See trait category used, but NOT the opponent's value.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {gameStarted && gamePhase === 'discard' && (
          <>
            {/* Timer - Top Right Corner - Always Visible */}
            {validCitizens.length >= 24 && (
              <div className="fixed top-8 right-8 z-[100] text-center">
                <div className={`text-7xl font-bold ${timer <= 10 ? 'text-red-500 animate-pulse drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]' : 'text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]'}`}>
                  {timer}
                </div>
                <div className="text-sm text-gray-300 font-semibold">seconds</div>
              </div>
            )}

            {validCitizens.length < 24 && (
              <div className="mt-36 text-center">
                <p className="text-2xl text-cyan-300 mb-4 animate-pulse">Drawing your 12...</p>
                <p className="text-lg text-purple-300">{validCitizens.length} / 24 loading (need 24 total)</p>
              </div>
            )}

            <div className="hidden">
              {citizens.map((card) => (
                <img key={card.id} src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${card.id}.png`} alt="" onLoad={() => handleImageLoad(card.id)} onError={() => handleImageError(card.id)} />
              ))}
            </div>

            {validCitizens.length >= 24 && (
              <div className="mt-36 w-full max-w-6xl mx-auto px-4">
                {/* Big Gold "Discard 3 Cards" Message - Shows for 2 seconds */}
                {showDiscardMessage && (
                  <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                    <div className="text-8xl font-bold text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,1)] animate-pulse">
                      Discard 3 Cards
                    </div>
                  </div>
                )}
                
                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 transition-opacity duration-500 ${showDiscardMessage ? 'opacity-30' : 'opacity-100'}`}>
                  {validCitizens.slice(0, 12).map((card) => {
                    const isDiscarded = discardedCards.includes(card.id)
                    const isSelected = selectedForDiscard === card.id
                    return (
                      <div
                        key={card.id}
                        className={`bg-gray-900/70 border rounded-xl overflow-hidden shadow-lg transition-all duration-300 cursor-pointer ${
                          isDiscarded ? 'opacity-30 border-red-600/40' : isSelected ? 'border-yellow-500 shadow-yellow-500/50 scale-105' : 'border-cyan-600/40 shadow-cyan-900/30 hover:border-yellow-500 hover:shadow-yellow-500/50 hover:scale-105'
                        }`}
                        onClick={() => !isDiscarded && setSelectedForDiscard(card.id)}
                      >
                        <img src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${card.id}.png`} alt={`Citizen ${card.id}`} className="w-full aspect-square object-cover" />
                        <p className="text-xl font-bold text-cyan-200 text-center py-3">#{card.id}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {selectedForDiscard !== null && gamePhase === 'discard' && !discardedCards.includes(selectedForDiscard) && (
          <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50 p-4" onClick={() => setSelectedForDiscard(null)}>
            <div className="flex items-center gap-8">
              {/* Big Discard Button on Far Left */}
              <div className="flex flex-col items-center gap-6">
                <button
                  className="px-20 py-12 text-6xl font-bold text-white bg-gradient-to-r from-red-600 to-red-800 rounded-xl shadow-2xl shadow-red-500/50 hover:shadow-red-400/80 hover:scale-105 transition-all"
                  onClick={(e) => { e.stopPropagation(); handleDiscard(); }}
                >
                  DISCARD
                </button>
                <div className="text-4xl font-bold text-cyan-300">[{discardedCards.length}/3]</div>
              </div>

              {/* Card Preview Section - Centered with Left/Right Previews */}
              <div className="flex items-center justify-center gap-6">
                {/* Left Preview Card */}
                {(() => {
                  const availableCards = validCitizens.slice(0, 12).filter(c => !discardedCards.includes(c.id))
                  const currentIndex = availableCards.findIndex(c => c.id === selectedForDiscard)
                  const prevIndex = currentIndex > 0 ? currentIndex - 1 : availableCards.length - 1
                  const prevCard = availableCards[prevIndex]
                  return (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-[160px] opacity-50 hover:opacity-100 transition-all cursor-pointer hover:scale-105" onClick={(e) => { e.stopPropagation(); setSelectedForDiscard(prevCard.id); }}>
                        <img src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${prevCard.id}.png`} alt={`Citizen ${prevCard.id}`} className="w-full aspect-square object-cover rounded-xl border-2 border-cyan-600" />
                      </div>
                      <div className="text-cyan-400 text-5xl leading-none select-none opacity-50 hover:opacity-100 cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedForDiscard(prevCard.id); }}>‹</div>
                    </div>
                  )
                })()}

                {/* Main Centered Card with Traits */}
                <div className="bg-gradient-to-b from-gray-900 to-black border-4 border-cyan-600 rounded-2xl w-full max-w-[280px] overflow-hidden shadow-2xl shadow-cyan-700/70 relative" onClick={(e) => e.stopPropagation()}>
                  <button className="absolute top-2 right-3 text-cyan-300 text-2xl hover:text-white z-10 transition-colors" onClick={() => setSelectedForDiscard(null)}>×</button>
                  <h3 className="text-lg font-bold text-cyan-300 text-center pt-2 pb-1">Citizen #{selectedForDiscard}</h3>
                  <div className="w-full aspect-square bg-black flex items-center justify-center border-b-4 border-cyan-700/50">
                    <img src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${selectedForDiscard}.png`} alt={`Citizen #${selectedForDiscard}`} className="w-full h-full object-contain" />
                  </div>
                  <div className="p-2 pt-1">
                    {(() => {
                      const traits = citizenTraits[selectedForDiscard]
                      if (!traits) return <div className="text-cyan-300 text-xs text-center py-4">Loading traits...</div>
                      
                      const availableTraits = getAvailableTraits()
                      
                      return (
                        <div className={`grid ${gameMode === 'chaotic' || gameMode === 'threat-intelligence' ? 'grid-cols-3' : 'grid-cols-4'} gap-1 text-center`}>
                          {availableTraits.map(({ label, value: traitKey, key }) => {
                            const value = traits[traitKey as keyof CitizenTraits]
                            return (
                              <div key={label} className="bg-gray-800/70 border-2 border-cyan-700/40 rounded p-1 h-[42px] flex flex-col justify-center opacity-70">
                                <div className={`text-cyan-400 font-semibold leading-tight ${label === 'Attractiveness' || label === 'Tech Skill' ? 'text-[7px]' : 'text-[8px]'}`}>{label}</div>
                                <div className={`text-[9px] leading-tight overflow-hidden text-ellipsis line-clamp-2 ${isUltraRareTrait(key, value) ? 'text-yellow-400 font-bold' : isRareTrait(key, value) ? 'text-purple-300 font-semibold' : 'text-white'}`}>{value}</div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Right Preview Card */}
                {(() => {
                  const availableCards = validCitizens.slice(0, 12).filter(c => !discardedCards.includes(c.id))
                  const currentIndex = availableCards.findIndex(c => c.id === selectedForDiscard)
                  const nextIndex = currentIndex < availableCards.length - 1 ? currentIndex + 1 : 0
                  const nextCard = availableCards[nextIndex]
                  return (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-[160px] opacity-50 hover:opacity-100 transition-all cursor-pointer hover:scale-105" onClick={(e) => { e.stopPropagation(); setSelectedForDiscard(nextCard.id); }}>
                        <img src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${nextCard.id}.png`} alt={`Citizen ${nextCard.id}`} className="w-full aspect-square object-cover rounded-xl border-2 border-cyan-600" />
                      </div>
                      <div className="text-cyan-400 text-5xl leading-none select-none opacity-50 hover:opacity-100 cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedForDiscard(nextCard.id); }}>›</div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        )}

        {gamePhase === 'battle' && (
          <div className="fixed inset-0 flex flex-col">
            {/* Battle Background - Battlefield Image */}
            <div 
              className="absolute inset-0 bg-no-repeat bg-cover z-0"
              style={{
                backgroundImage: "url('https://raw.githubusercontent.com/badfuture-926/neo-tokyo-card-clash/main/Battlefield.png')",
                backgroundPosition: "center center",
              }}
            />
            {/* Dark overlay for better visibility */}
            <div className="absolute inset-0 bg-black/40 z-0" />
            
            {/* Timer - Top Right Corner - Always Visible */}
            {!playerBattleCard && (
              <div className="fixed top-8 right-8 z-[100] text-center">
                <div className={`text-7xl font-bold ${timer <= 10 ? 'text-red-500 animate-pulse drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]' : 'text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]'}`}>
                  {timer}
                </div>
                <div className="text-sm text-gray-300 font-semibold">seconds</div>
              </div>
            )}

            {/* Opponent deck - top */}
            <div className="flex justify-center items-center gap-2 p-4 bg-gradient-to-b from-black/80 to-transparent relative z-10">
              {opponentDeck.map((cardId) => (
                <div key={cardId} className="w-36 bg-gray-900/70 border border-red-600/40 rounded-lg overflow-hidden shadow-lg">
                  <img src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${cardId}.png`} alt={`Opponent ${cardId}`} className="w-full aspect-square object-cover opacity-80" />
                </div>
              ))}
            </div>

            {/* Battle area - middle */}
            <div className="flex-1 flex items-center justify-center gap-6 relative z-10">
              {/* Score Display - Far Left */}
              <div className="absolute left-8 top-1/2 transform -translate-y-1/2 bg-gray-900/90 border-4 border-cyan-600 rounded-xl p-4 shadow-2xl">
                <div className="text-center mb-3">
                  <div className="text-cyan-400 text-sm font-bold">YOU</div>
                  <div className="text-white text-4xl font-bold">{playerScore}</div>
                </div>
                <div className="border-t-2 border-gray-700 my-2"></div>
                <div className="text-center">
                  <div className="text-red-400 text-sm font-bold">OPP</div>
                  <div className="text-white text-4xl font-bold">{opponentScore}</div>
                </div>
              </div>

              {/* Turn Indicator - Far Right */}
              <div className="absolute right-8 top-1/2 transform -translate-y-1/2 bg-gray-900/90 border-4 rounded-xl p-6 shadow-2xl" style={{
                borderColor: isPlayerTurn ? '#06b6d4' : '#ef4444'
              }}>
                <div className="text-center">
                  <div className={`text-sm font-bold mb-2 ${isPlayerTurn ? 'text-cyan-400' : 'text-red-400'}`}>
                    CURRENT TURN
                  </div>
                  <div className={`text-3xl font-bold ${isPlayerTurn ? 'text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]' : 'text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]'} animate-pulse`}>
                    {isPlayerTurn ? '👤 YOU' : '🤖 AI'}
                  </div>
                  <div className={`text-xs font-semibold mt-2 ${isPlayerTurn ? 'text-cyan-300' : 'text-red-300'}`}>
                    {isPlayerTurn ? 'Pick & Attack' : 'Defending...'}
                  </div>
                </div>
              </div>

              {/* Battle Animation Overlay */}
              {showBattleAnimation && (
                <div className="absolute inset-0 flex items-center justify-center z-50">
                  <div className="text-6xl font-bold text-yellow-400 animate-pulse drop-shadow-[0_0_20px_rgba(250,204,21,1)]">
                    ⚔️ CLASH! ⚔️
                  </div>
                </div>
              )}

              {/* Battle Result */}
              {battleResult && !gameOver && (
                <div className="absolute inset-0 flex items-center justify-center z-50">
                  <div className={`bg-gray-900/95 border-4 rounded-2xl p-8 shadow-2xl ${
                    battleResult.winner === 'player' ? 'border-cyan-500' : 'border-red-500'
                  }`}>
                    <div className={`text-4xl font-bold mb-4 ${
                      battleResult.winner === 'player' ? 'text-cyan-400' : 'text-red-400'
                    }`}>
                      {battleResult.winner === 'player' ? '🎉 YOU WIN!' : '😞 YOU LOSE!'}
                    </div>
                    <div className="text-white text-2xl font-semibold text-center">
                      {battleResult.message}
                    </div>
                  </div>
                </div>
              )}

              {/* Game Over Screen */}
              {gameOver && (
                <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[200] cursor-pointer" onClick={() => window.location.reload()}>
                  <div className={`bg-gradient-to-b from-gray-900 to-black border-8 rounded-3xl p-16 shadow-2xl ${
                    gameOver === 'win' ? 'border-cyan-500' : 'border-red-500'
                  }`} onClick={(e) => e.stopPropagation()}>
                    <div className={`text-8xl font-bold mb-8 text-center ${
                      gameOver === 'win' ? 'text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,1)]' : 'text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,1)]'
                    }`}>
                      {gameOver === 'win' ? '🏆 YOU WIN! 🏆' : '💀 YOU LOSE 💀'}
                    </div>
                    <div className="text-white text-4xl font-bold text-center mb-8">
                      Final Score: {playerScore} - {opponentScore}
                    </div>
                    <button
                      className="w-full px-12 py-6 text-3xl font-bold text-black bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl shadow-2xl hover:scale-105 transition-all"
                      onClick={() => window.location.reload()}
                    >
                      Play Again
                    </button>
                    <div className="text-gray-400 text-sm text-center mt-4">
                      Click anywhere to return to menu
                    </div>
                  </div>
                </div>
              )}

              {/* Your Card slot */}
              <div className="w-68 border-4 border-dashed border-cyan-500/40 rounded-xl flex items-center justify-center p-2">
                {playerBattleCard ? (
                  <div className="bg-gradient-to-b from-gray-900 to-black border-3 border-cyan-600 rounded-xl w-full overflow-hidden shadow-2xl shadow-cyan-700/70">
                    <h3 className="text-base font-bold text-cyan-300 text-center pt-1.5 pb-1">#{playerBattleCard}</h3>
                    <div className="w-full aspect-square bg-black flex items-center justify-center border-b-2 border-cyan-700/50">
                      <img 
                        src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${playerBattleCard}.png`}
                        alt={`Your Citizen ${playerBattleCard}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {/* Selected Trait Display - Even More Compact */}
                    <div className="p-2 text-center">
                      <div className="text-cyan-400 text-[7px] font-semibold mb-0.5">
                        {isPlayerTurn ? 'Attacking With:' : 'Defending With:'}
                      </div>
                      <div className="bg-gray-800/70 border-2 border-purple-500 bg-purple-900/50 rounded px-2 py-0.5">
                        <div className="text-white text-xs font-bold leading-tight">{playerSelectedTrait}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-cyan-400 text-xl font-bold">Your Card</div>
                )}
              </div>
              
              {/* VS Indicator - Hidden during CLASH animation or battle result */}
              {!showBattleAnimation && !battleResult && (
                <div className="text-6xl font-bold text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] animate-pulse">VS</div>
              )}
              
              {/* Opponent's Card slot */}
              <div className="w-68 border-4 border-dashed border-red-500/40 rounded-xl flex items-center justify-center p-2">
                {opponentBattleCard ? (
                  <div className="bg-gradient-to-b from-gray-900 to-black border-3 border-red-600 rounded-xl w-full overflow-hidden shadow-2xl shadow-red-700/70">
                    <h3 className="text-base font-bold text-red-300 text-center pt-1.5 pb-1">#{opponentBattleCard}</h3>
                    <div className="w-full aspect-square bg-black flex items-center justify-center border-b-2 border-red-700/50">
                      <img 
                        src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${opponentBattleCard}.png`}
                        alt={`Opponent Citizen ${opponentBattleCard}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {/* Opponent trait - Show actual trait only after player defends */}
                    <div className="p-2 text-center">
                      <div className="text-red-400 text-[7px] font-semibold mb-0.5">
                        {isPlayerTurn ? 'Defending With:' : 'Attacking With:'}
                      </div>
                      <div className="bg-gray-800/70 border-2 border-red-500 bg-red-900/50 rounded px-2 py-0.5">
                        <div className="text-white text-xs font-bold leading-tight">
                          {!isPlayerTurn && !playerBattleCard ? '???' : opponentSelectedTrait}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-400 text-xl font-bold">Opponent's Card</div>
                )}
              </div>
            </div>

            {/* Player deck - bottom */}
            <div className="flex justify-center items-center gap-2 p-4 bg-gradient-to-t from-black/80 to-transparent relative z-10">
              {playerDeck.map((cardId) => {
                // Hide card if it's currently in battle
                if (cardId === playerBattleCard) {
                  return (
                    <div key={cardId} className="w-36 opacity-0">
                      {/* Placeholder to maintain spacing */}
                    </div>
                  )
                }
                
                return (
                  <div
                    key={cardId}
                    className={`w-36 bg-gray-900/70 border rounded-lg overflow-hidden shadow-lg cursor-pointer transition-all ${selectedBattleCard === cardId ? 'border-cyan-500 shadow-cyan-500/50 scale-110' : 'border-cyan-600/40 hover:border-yellow-500 hover:shadow-yellow-500/50 hover:scale-105'}`}
                    onClick={() => setSelectedBattleCard(cardId)}
                  >
                    <img src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${cardId}.png`} alt={`Citizen ${cardId}`} className="w-full aspect-square object-cover" />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {selectedBattleCard !== null && gamePhase === 'battle' && (
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4" onClick={() => { setSelectedBattleCard(null); setSelectedTrait(null); }}>
            {/* Select trait instruction - only for attack mode when no trait selected */}
            {selectedTrait === null && isPlayerTurn && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-yellow-400 text-2xl font-bold animate-pulse bg-black/80 px-6 py-2 rounded-lg border-2 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)] z-[60]">
                ⚔️ Select a trait to attack with ⚔️
              </div>
            )}
            
            {selectedTrait && isPlayerTurn && (
              <button
                className="absolute right-8 top-1/2 -translate-y-1/2 px-12 py-8 font-bold text-white bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl shadow-2xl shadow-purple-500/70 hover:shadow-purple-400/90 hover:scale-105 transition-all"
                style={{ fontSize: '48px', lineHeight: '1' }}
                onClick={(e) => { 
                  e.stopPropagation();
                  // Player is attacking
                  setPlayerBattleCard(selectedBattleCard);
                  setPlayerSelectedTrait(selectedTrait);
                  setSelectedBattleCard(null);
                  setSelectedTrait(null);
                }}
              >
                ATTACK
              </button>
            )}
            
            {selectedBattleCard && !isPlayerTurn && opponentSelectedTrait && (
              <button
                className="absolute right-8 top-1/2 -translate-y-1/2 px-12 py-8 font-bold text-white bg-gradient-to-r from-green-600 to-green-800 rounded-2xl shadow-2xl shadow-green-500/70 hover:shadow-green-400/90 hover:scale-105 transition-all"
                style={{ fontSize: '48px', lineHeight: '1' }}
                onClick={(e) => { 
                  e.stopPropagation();
                  // Player is defending - use player's actual trait value for the trait category opponent attacked with
                  const opponentTraitCategory = opponentSelectedTrait.split(': ')[0]
                  const playerTraits = citizenTraits[selectedBattleCard]
                  
                  if (playerTraits && opponentTraitCategory) {
                    let playerTraitValue: string | number = ''
                    switch(opponentTraitCategory) {
                      case 'Class': playerTraitValue = playerTraits.class; break
                      case 'Race': playerTraitValue = playerTraits.race; break
                      case 'Eyes': playerTraitValue = playerTraits.eyes; break
                      case 'Location': playerTraitValue = playerTraits.location; break
                      case 'Item': playerTraitValue = playerTraits.additionalItem; break
                      case 'Weapon': playerTraitValue = playerTraits.weapon; break
                      case 'Vehicle': playerTraitValue = playerTraits.vehicle; break
                      case 'Apparel': playerTraitValue = playerTraits.apparel; break
                      case 'Helm': playerTraitValue = playerTraits.helm; break
                      case 'Reward': playerTraitValue = playerTraits.rewardRate; break
                      case 'Ability': playerTraitValue = playerTraits.ability; break
                      case 'Strength': playerTraitValue = playerTraits.strength; break
                      case 'Intelligence': playerTraitValue = playerTraits.intelligence; break
                      case 'Cool': playerTraitValue = playerTraits.cool; break
                      case 'Tech Skill': playerTraitValue = playerTraits.techSkill; break
                      case 'Attractiveness': playerTraitValue = playerTraits.attractiveness; break
                    }
                    
                    setPlayerBattleCard(selectedBattleCard);
                    setPlayerSelectedTrait(`${opponentTraitCategory}: ${playerTraitValue}`);
                    
                    // In Threat Intelligence mode, reveal opponent's actual value now that defense is placed
                    if (gameMode === 'threat-intelligence' && opponentSelectedTrait && opponentSelectedTrait.includes('???')) {
                      const opponentTraits = citizenTraits[opponentBattleCard!]
                      if (opponentTraits) {
                        let opponentActualValue: string | number = ''
                        switch(opponentTraitCategory) {
                          case 'Class': opponentActualValue = opponentTraits.class; break
                          case 'Race': opponentActualValue = opponentTraits.race; break
                          case 'Eyes': opponentActualValue = opponentTraits.eyes; break
                          case 'Location': opponentActualValue = opponentTraits.location; break
                          case 'Item': opponentActualValue = opponentTraits.additionalItem; break
                          case 'Weapon': opponentActualValue = opponentTraits.weapon; break
                          case 'Vehicle': opponentActualValue = opponentTraits.vehicle; break
                          case 'Apparel': opponentActualValue = opponentTraits.apparel; break
                          case 'Helm': opponentActualValue = opponentTraits.helm; break
                          case 'Reward': opponentActualValue = opponentTraits.rewardRate; break
                          case 'Ability': opponentActualValue = opponentTraits.ability; break
                          case 'Strength': opponentActualValue = opponentTraits.strength; break
                          case 'Intelligence': opponentActualValue = opponentTraits.intelligence; break
                          case 'Cool': opponentActualValue = opponentTraits.cool; break
                          case 'Tech Skill': opponentActualValue = opponentTraits.techSkill; break
                          case 'Attractiveness': opponentActualValue = opponentTraits.attractiveness; break
                        }
                        setOpponentSelectedTrait(`${opponentTraitCategory}: ${opponentActualValue}`)
                      }
                    }
                  }
                  setSelectedBattleCard(null);
                  setSelectedTrait(null);
                }}
              >
                DEFEND
              </button>
            )}

            <div className="flex items-center justify-center gap-6">
              {(() => {
                const currentIndex = playerDeck.findIndex(id => id === selectedBattleCard)
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : playerDeck.length - 1
                const prevCard = playerDeck[prevIndex]
                return (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-[160px] opacity-50 hover:opacity-100 transition-all cursor-pointer hover:scale-105" onClick={(e) => { e.stopPropagation(); setSelectedBattleCard(prevCard); setSelectedTrait(null); }}>
                      <img src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${prevCard}.png`} alt={`Citizen ${prevCard}`} className="w-full aspect-square object-cover rounded-xl border-2 border-cyan-600" />
                    </div>
                    <div className="text-cyan-400 text-5xl leading-none select-none opacity-50 hover:opacity-100 cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedBattleCard(prevCard); setSelectedTrait(null); }}>‹</div>
                  </div>
                )
              })()}

              <div className="bg-gradient-to-b from-gray-900 to-black border-4 border-cyan-600 rounded-2xl w-full max-w-[280px] overflow-hidden shadow-2xl shadow-cyan-700/70 relative" onClick={(e) => e.stopPropagation()}>
                <button className="absolute top-2 right-3 text-cyan-300 text-2xl hover:text-white z-10 transition-colors" onClick={() => { setSelectedBattleCard(null); setSelectedTrait(null); }}>×</button>
                <h3 className="text-lg font-bold text-cyan-300 text-center pt-2 pb-1">Citizen #{selectedBattleCard}</h3>
                <div className="w-full aspect-square bg-black flex items-center justify-center border-b-4 border-cyan-700/50">
                  <img src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${selectedBattleCard}.png`} alt={`Citizen #${selectedBattleCard}`} className="w-full h-full object-contain" />
                </div>
                <div className="p-2 pt-1">
                  {(() => {
                    const traits = citizenTraits[selectedBattleCard]
                    if (!traits) return <div className="text-cyan-300 text-xs text-center py-4">Loading traits...</div>
                    
                    // In Threat Intelligence mode when defending, show only the defending trait
                    if (gameMode === 'threat-intelligence' && !isPlayerTurn && opponentSelectedTrait) {
                      const opponentTraitCategory = opponentSelectedTrait.split(': ')[0]
                      let defendingValue: string | number = ''
                      
                      switch(opponentTraitCategory) {
                        case 'Class': defendingValue = traits.class; break
                        case 'Race': defendingValue = traits.race; break
                        case 'Eyes': defendingValue = traits.eyes; break
                        case 'Location': defendingValue = traits.location; break
                        case 'Item': defendingValue = traits.additionalItem; break
                        case 'Weapon': defendingValue = traits.weapon; break
                        case 'Vehicle': defendingValue = traits.vehicle; break
                        case 'Apparel': defendingValue = traits.apparel; break
                        case 'Helm': defendingValue = traits.helm; break
                        case 'Reward': defendingValue = traits.rewardRate; break
                        case 'Ability': defendingValue = traits.ability; break
                        case 'Strength': defendingValue = traits.strength; break
                        case 'Intelligence': defendingValue = traits.intelligence; break
                        case 'Cool': defendingValue = traits.cool; break
                        case 'Tech Skill': defendingValue = traits.techSkill; break
                        case 'Attractiveness': defendingValue = traits.attractiveness; break
                      }
                      
                      // Determine rarity color
                      const isUltra = isUltraRareTrait(opponentTraitCategory, defendingValue)
                      const isRare = isRareTrait(opponentTraitCategory, defendingValue)
                      const rarityColor = isUltra ? 'text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 
                                         isRare ? 'text-purple-300 font-semibold' : 
                                         'text-white'
                      
                      return (
                        <div className="text-center p-6 bg-yellow-900/30 border-2 border-yellow-500 rounded-lg">
                          <div className="text-yellow-400 text-sm font-bold mb-3">DEFENDING WITH:</div>
                          <div className="text-cyan-400 text-xs font-semibold mb-1">{opponentTraitCategory}</div>
                          <div className={`text-2xl font-bold ${rarityColor}`}>
                            {defendingValue}
                          </div>
                        </div>
                      )
                    }
                    
                    // Normal mode or attack mode - show all traits
                    const availableTraits = getAvailableTraits()
                    
                    return (
                      <div className={`grid ${gameMode === 'chaotic' || gameMode === 'threat-intelligence' ? 'grid-cols-3' : 'grid-cols-4'} gap-1 text-center`}>
                        {availableTraits.map(({ label, value: traitKey, key }) => {
                          const value = traits[traitKey as keyof CitizenTraits]
                          // In Threat Intelligence mode, highlight the trait being attacked
                          const isAttackingTrait = !isPlayerTurn && gameMode === 'threat-intelligence' && opponentSelectedTrait && opponentSelectedTrait.startsWith(label)
                          
                          return (
                          <div 
                            key={label}
                            className={`bg-gray-800/70 border-2 rounded p-1 h-[42px] flex flex-col justify-center ${
                              isPlayerTurn 
                                ? 'cursor-pointer transition-all' 
                                : isAttackingTrait 
                                  ? 'border-yellow-500 bg-yellow-900/30' 
                                  : 'opacity-70'
                            } ${
                              selectedTrait === `${label}: ${value}` 
                                ? 'border-purple-500 bg-purple-900/50' 
                                : isPlayerTurn 
                                  ? 'border-cyan-700/40 hover:border-purple-500' 
                                  : 'border-cyan-700/40'
                            }`}
                            onClick={isPlayerTurn ? (e) => { e.stopPropagation(); setSelectedTrait(`${label}: ${value}`); } : undefined}
                          >
                            <div className={`text-cyan-400 font-semibold leading-tight ${label === 'Attractiveness' ? 'text-[7px]' : 'text-[8px]'}`}>{label}</div>
                            <div className={`leading-tight overflow-hidden text-ellipsis line-clamp-2 ${
                              label === 'Attractiveness' || label.includes('Strength') || label.includes('Intelligence') || label.includes('Cool') || label.includes('Tech') ? 'text-[9px]' : 'text-[9px]'
                            } ${
                              isUltraRareTrait(key, value) ? 'text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 
                              isRareTrait(key, value) ? 'text-purple-300 font-semibold' : 
                              'text-white'
                            }`}>{value}</div>
                          </div>
                        )})}
                      </div>
                    )
                  })()}
                </div>
              </div>

              {(() => {
                const currentIndex = playerDeck.findIndex(id => id === selectedBattleCard)
                const nextIndex = currentIndex < playerDeck.length - 1 ? currentIndex + 1 : 0
                const nextCard = playerDeck[nextIndex]
                return (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-[160px] opacity-50 hover:opacity-100 transition-all cursor-pointer hover:scale-105" onClick={(e) => { e.stopPropagation(); setSelectedBattleCard(nextCard); setSelectedTrait(null); }}>
                      <img src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${nextCard}.png`} alt={`Citizen ${nextCard}`} className="w-full aspect-square object-cover rounded-xl border-2 border-cyan-600" />
                    </div>
                    <div className="text-cyan-400 text-5xl leading-none select-none opacity-50 hover:opacity-100 cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedBattleCard(nextCard); setSelectedTrait(null); }}>›</div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
