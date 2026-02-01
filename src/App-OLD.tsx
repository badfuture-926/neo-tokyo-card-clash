import { useState, useEffect } from 'react'
import './style.css'
import { isRareTrait, isUltraRareTrait } from './rareTraits'

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
  const [citizens, setCitizens] = useState<CitizenCard[]>([])
  const [selectedCitizen, setSelectedCitizen] = useState<number | null>(null)
  const [selectedTrait, setSelectedTrait] = useState<string | null>(null)
  const [citizenTraits, setCitizenTraits] = useState<Record<number, CitizenTraits>>({})

  const startGame = () => {
    setGameStarted(true)
    
    const randomIds = new Set<number>()
    while (randomIds.size < 24) {
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
  }

  const handleImageError = (id: number) => {
    setCitizens(prev => prev.filter(card => card.id !== id))
  }

  const validCitizens = citizens.filter(c => c.loaded)

  // Fetch traits using Alchemy API
  const fetchTraitsForCitizen = async (citizenId: number): Promise<CitizenTraits | null> => {
    try {
      const alchemyApiKey = '0uBM1JotEbL5ERgVwcDEa'
      const contractAddress = '0xb9951b43802dcf3ef5b14567cb17adf367ed1c0f'
      
      // Use Alchemy's getNFTMetadata endpoint
      const url = `https://eth-mainnet.g.alchemy.com/nft/v3/${alchemyApiKey}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${citizenId}&refreshCache=false`
      
      console.log('Fetching from Alchemy:', url)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        console.error('Alchemy fetch failed:', response.status, await response.text())
        return generateRandomTraits()
      }
      
      const data = await response.json()
      console.log('Alchemy data for citizen', citizenId, ':', data)
      
      // Parse traits from Alchemy response
      // The metadata should be in data.raw.metadata.attributes or data.metadata
      const attributes = data.raw?.metadata?.attributes || data.metadata?.attributes || []
      
      if (!Array.isArray(attributes) || attributes.length === 0) {
        console.error('No attributes found in Alchemy response')
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
      
      console.log('Parsed traits:', traits)
      
      // Verify we got essential data
      if (traits.class && traits.race) {
        return traits as CitizenTraits
      }
      
      console.log('Missing essential traits, using random')
      return generateRandomTraits()
    } catch (error) {
      console.error('Error fetching traits:', error)
      return generateRandomTraits()
    }
  }

  // Generate random traits as fallback
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

  // Get traits for a citizen, fetching if needed
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

  // Fetch traits when a citizen is selected
  useEffect(() => {
    if (selectedCitizen) {
      getTraitsForCitizen(selectedCitizen)
    }
  }, [selectedCitizen])

  // Keyboard navigation
  useEffect(() => {
    if (selectedCitizen === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const displayedCards = validCitizens.slice(0, 12)
      const currentIndex = displayedCards.findIndex(c => c.id === selectedCitizen)
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : displayedCards.length - 1
        setSelectedCitizen(displayedCards[prevIndex].id)
        setSelectedTrait(null)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        const nextIndex = currentIndex < displayedCards.length - 1 ? currentIndex + 1 : 0
        setSelectedCitizen(displayedCards[nextIndex].id)
        setSelectedTrait(null)
      } else if (e.key === 'Escape') {
        setSelectedCitizen(null)
        setSelectedTrait(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCitizen, validCitizens])

  return (
    <div className="relative w-screen min-h-screen overflow-hidden flex flex-col items-center justify-start">

      {/* BACKGROUND IMAGE */}
      <div
        className="absolute inset-0 bg-no-repeat bg-cover"
        style={{
          backgroundImage:
            "url('https://raw.githubusercontent.com/badfuture-926/neo-tokyo-card-clash/images/Neo%20Tokyo%20Card%20Clash%20Background.png')",
          backgroundPosition: "calc(50% + 40px) 15%",
        }}
      />

      {/* GRADIENT OVERLAY */}
      <div className="absolute inset-0 pointer-events-none
        bg-gradient-to-b
        from-transparent
        via-black/40
        to-black/80"
      />

      {/* ACCESSIBILITY TITLE */}
      <h1 className="sr-only">Neo Tokyo Card Clash</h1>

      {/* UI CONTENT */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen gap-8">

        {!gameStarted && (
          <>
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
                <span className="group-hover:opacity-0 transition-opacity duration-300">
                  Play Vs a Friend
                </span>
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-yellow-400">
                  Coming Soon
                </span>
              </button>
            </div>
          </>
        )}

        {gameStarted && (
          <>
            {validCitizens.length < 12 && (
              <div className="mt-36 text-center">
                <p className="text-2xl text-cyan-300 mb-4 animate-pulse">Drawing Citizens...</p>
                <p className="text-lg text-purple-300">{validCitizens.length} / 12 found</p>
              </div>
            )}

            {/* Hidden images for preloading */}
            <div className="hidden">
              {citizens.map((card) => (
                <img
                  key={card.id}
                  src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${card.id}.png`}
                  alt=""
                  onLoad={() => handleImageLoad(card.id)}
                  onError={() => handleImageError(card.id)}
                />
              ))}
            </div>

            {validCitizens.length > 0 && (
              <div className="mt-36 w-full max-w-6xl mx-auto px-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {validCitizens.slice(0, 12).map((card) => (
                    <div
                      key={card.id}
                      className="bg-gray-900/70 border border-cyan-600/40 rounded-xl overflow-hidden shadow-lg shadow-cyan-900/30 hover:shadow-cyan-500/50 transition-all duration-300 cursor-pointer hover:scale-105"
                      onClick={() => setSelectedCitizen(card.id)}
                    >
                      <img
                        src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${card.id}.png`}
                        alt={`Citizen ${card.id}`}
                        className="w-full aspect-square object-cover"
                      />
                      <p className="text-xl font-bold text-cyan-200 text-center py-3">
                        #{card.id}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Selected citizen modal */}
        {selectedCitizen !== null && (
          <div
            className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50 p-4"
            onClick={() => {
              setSelectedCitizen(null)
              setSelectedTrait(null)
            }}
          >
            {/* Trait Selection Header */}
            <div className="absolute top-8 left-0 right-0 flex items-center justify-center">
              <p className="text-2xl text-cyan-300 font-semibold">Choose your trait</p>
            </div>

            {/* Attack Button */}
            {selectedTrait && (
              <button
                className="absolute top-8 right-8 px-16 py-8 text-5xl font-bold text-white bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl shadow-2xl shadow-purple-500/50 hover:shadow-purple-400/80 hover:scale-105 transition-all"
                onClick={(e) => {
                  e.stopPropagation()
                  alert(`Attacking with ${selectedTrait}!`)
                }}
              >
                ATTACK
              </button>
            )}

            {/* Card Preview Section */}
            <div className="flex items-center justify-center gap-6">
              {/* Left Preview Card */}
              {(() => {
                const displayedCards = validCitizens.slice(0, 12)
                const currentIndex = displayedCards.findIndex(c => c.id === selectedCitizen)
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : displayedCards.length - 1
                const prevCard = displayedCards[prevIndex]
                
                return (
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="w-[160px] opacity-50 hover:opacity-100 transition-all cursor-pointer hover:scale-105"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCitizen(prevCard.id)
                        setSelectedTrait(null)
                      }}
                    >
                      <img
                        src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${prevCard.id}.png`}
                        alt={`Citizen ${prevCard.id}`}
                        className="w-full aspect-square object-cover rounded-xl border-2 border-cyan-600"
                      />
                    </div>
                    <div 
                      className="text-cyan-400 text-5xl leading-none select-none opacity-50 hover:opacity-100 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCitizen(prevCard.id)
                        setSelectedTrait(null)
                      }}
                    >
                      ‹
                    </div>
                  </div>
                )
              })()}

              {/* Main Card */}
              <div
                className="bg-gradient-to-b from-gray-900 to-black border-4 border-cyan-600 rounded-2xl w-full max-w-[280px] overflow-hidden shadow-2xl shadow-cyan-700/70 relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="absolute top-2 right-3 text-cyan-300 text-2xl hover:text-white z-10 transition-colors"
                  onClick={() => {
                    setSelectedCitizen(null)
                    setSelectedTrait(null)
                  }}
                >
                  ×
                </button>

                <h3 className="text-lg font-bold text-cyan-300 text-center pt-2 pb-1">
                  Citizen #{selectedCitizen}
                </h3>

                <div className="w-full aspect-square bg-black flex items-center justify-center border-b-4 border-cyan-700/50">
                  <img
                    src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${selectedCitizen}.png`}
                    alt={`Citizen #${selectedCitizen}`}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="p-2 pt-1">
                  <div className="grid grid-cols-4 gap-1 text-center">
                    {(() => {
                      const traits = selectedCitizen ? citizenTraits[selectedCitizen] : null
                      if (!traits) return <div className="col-span-4 text-cyan-300 text-xs">Loading traits...</div>
                      
                      return (
                        <>
                          <div 
                            className={`bg-gray-800/70 border-2 rounded p-1 cursor-pointer transition-all h-[42px] flex flex-col justify-center ${
                              selectedTrait === `Class: ${traits.class}` 
                                ? 'border-purple-500 bg-purple-900/50' 
                                : 'border-cyan-700/40 hover:border-purple-500'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTrait(`Class: ${traits.class}`)
                            }}
                          >
                            <div className="text-cyan-400 font-semibold text-[8px] leading-tight">Class</div>
                            <div className={`text-[9px] leading-tight overflow-hidden text-ellipsis line-clamp-2 ${
                              isUltraRareTrait('Class', traits.class) 
                                ? 'text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' 
                                : isRareTrait('Class', traits.class) 
                                  ? 'text-purple-300 font-semibold' 
                                  : 'text-white'
                            }`}>{traits.class}</div>
                          </div>
                          <div 
                            className={`bg-gray-800/70 border-2 rounded p-1 cursor-pointer transition-all h-[42px] flex flex-col justify-center ${
                              selectedTrait === `Race: ${traits.race}` 
                                ? 'border-purple-500 bg-purple-900/50' 
                                : 'border-cyan-700/40 hover:border-purple-500'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTrait(`Race: ${traits.race}`)
                            }}
                          >
                            <div className="text-cyan-400 font-semibold text-[8px] leading-tight">Race</div>
                            <div className={`text-[9px] leading-tight overflow-hidden text-ellipsis line-clamp-2 ${
                              isUltraRareTrait('Race', traits.race) 
                                ? 'text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' 
                                : isRareTrait('Race', traits.race) 
                                  ? 'text-purple-300 font-semibold' 
                                  : 'text-white'
                            }`}>{traits.race}</div>
                          </div>
                          <div 
                            className={`bg-gray-800/70 border-2 rounded p-1 cursor-pointer transition-all h-[42px] flex flex-col justify-center ${
                              selectedTrait === `Eyes: ${traits.eyes}` 
                                ? 'border-purple-500 bg-purple-900/50' 
                                : 'border-cyan-700/40 hover:border-purple-500'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTrait(`Eyes: ${traits.eyes}`)
                            }}
                          >
                            <div className="text-cyan-400 font-semibold text-[8px] leading-tight">Eyes</div>
                            <div className={`text-[9px] leading-tight overflow-hidden text-ellipsis line-clamp-2 ${
                              isUltraRareTrait('Eyes', traits.eyes) 
                                ? 'text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' 
                                : isRareTrait('Eyes', traits.eyes) 
                                  ? 'text-purple-300 font-semibold' 
                                  : 'text-white'
                            }`}>{traits.eyes}</div>
                          </div>
                          <div 
                            className={`bg-gray-800/70 border-2 rounded p-1 cursor-pointer transition-all h-[42px] flex flex-col justify-center ${
                              selectedTrait === `Location: ${traits.location}` 
                                ? 'border-purple-500 bg-purple-900/50' 
                                : 'border-cyan-700/40 hover:border-purple-500'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTrait(`Location: ${traits.location}`)
                            }}
                          >
                            <div className="text-cyan-400 font-semibold text-[8px] leading-tight">Location</div>
                            <div className={`text-[9px] leading-tight overflow-hidden text-ellipsis line-clamp-2 ${
                              isUltraRareTrait('Location', traits.location) 
                                ? 'text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' 
                                : isRareTrait('Location', traits.location) 
                                  ? 'text-purple-300 font-semibold' 
                                  : 'text-white'
                            }`}>{traits.location}</div>
                          </div>

                          <div 
                            className={`bg-gray-800/70 border-2 rounded p-1 cursor-pointer transition-all h-[42px] flex flex-col justify-center ${
                              selectedTrait === `Item: ${traits.additionalItem}` 
                                ? 'border-purple-500 bg-purple-900/50' 
                                : 'border-cyan-700/40 hover:border-purple-500'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTrait(`Item: ${traits.additionalItem}`)
                            }}
                          >
                            <div className="text-cyan-400 font-semibold text-[8px] leading-tight">Item</div>
                            <div className={`text-[9px] leading-tight overflow-hidden text-ellipsis line-clamp-2 ${
                              isUltraRareTrait('Additional Item', traits.additionalItem) ? 'text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : isRareTrait('Additional Item', traits.additionalItem) ? 'text-purple-300 font-semibold' : 'text-white'
                            }`}>{traits.additionalItem}</div>
                          </div>
                          <div 
                            className={`bg-gray-800/70 border-2 rounded p-1 cursor-pointer transition-all h-[42px] flex flex-col justify-center ${
                              selectedTrait === `Weapon: ${traits.weapon}` 
                                ? 'border-purple-500 bg-purple-900/50' 
                                : 'border-cyan-700/40 hover:border-purple-500'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTrait(`Weapon: ${traits.weapon}`)
                            }}
                          >
                            <div className="text-cyan-400 font-semibold text-[8px] leading-tight">Weapon</div>
                            <div className={`text-[9px] leading-tight overflow-hidden text-ellipsis line-clamp-2 ${
                              isUltraRareTrait('Weapon', traits.weapon) ? 'text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : isRareTrait('Weapon', traits.weapon) ? 'text-purple-300 font-semibold' : 'text-white'
                            }`}>{traits.weapon}</div>
                          </div>
                          <div 
                            className={`bg-gray-800/70 border-2 rounded p-1 cursor-pointer transition-all h-[42px] flex flex-col justify-center ${
                              selectedTrait === `Vehicle: ${traits.vehicle}` 
                                ? 'border-purple-500 bg-purple-900/50' 
                                : 'border-cyan-700/40 hover:border-purple-500'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTrait(`Vehicle: ${traits.vehicle}`)
                            }}
                          >
                            <div className="text-cyan-400 font-semibold text-[8px] leading-tight">Vehicle</div>
                            <div className={`text-[9px] leading-tight overflow-hidden text-ellipsis line-clamp-2 ${
                              isUltraRareTrait('Vehicle', traits.vehicle) ? 'text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : isRareTrait('Vehicle', traits.vehicle) ? 'text-purple-300 font-semibold' : 'text-white'
                            }`}>{traits.vehicle}</div>
                          </div>
                          <div 
                            className={`bg-gray-800/70 border-2 rounded p-1 cursor-pointer transition-all h-[42px] flex flex-col justify-center ${
                              selectedTrait === `Apparel: ${traits.apparel}` 
                                ? 'border-purple-500 bg-purple-900/50' 
                                : 'border-cyan-700/40 hover:border-purple-500'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTrait(`Apparel: ${traits.apparel}`)
                            }}
                          >
                            <div className="text-cyan-400 font-semibold text-[8px] leading-tight">Apparel</div>
                            <div className={`text-[9px] leading-tight overflow-hidden text-ellipsis line-clamp-2 ${
                              isUltraRareTrait('Apparel', traits.apparel) ? 'text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : isRareTrait('Apparel', traits.apparel) ? 'text-purple-300 font-semibold' : 'text-white'
                            }`}>{traits.apparel}</div>
                          </div>

                          <div 
                            className={`bg-gray-800/70 border-2 rounded p-1 cursor-pointer transition-all h-[42px] flex flex-col justify-center ${
                              selectedTrait === `Helm: ${traits.helm}` 
                                ? 'border-purple-500 bg-purple-900/50' 
                                : 'border-cyan-700/40 hover:border-purple-500'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTrait(`Helm: ${traits.helm}`)
                            }}
                          >
                            <div className="text-cyan-400 font-semibold text-[8px] leading-tight">Helm</div>
                            <div className={`text-[9px] leading-tight overflow-hidden text-ellipsis line-clamp-2 ${
                              isUltraRareTrait('Helm', traits.helm) ? 'text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : isRareTrait('Helm', traits.helm) ? 'text-purple-300 font-semibold' : 'text-white'
                            }`}>{traits.helm}</div>
                          </div>
                          <div 
                            className={`bg-gray-800/70 border-2 rounded p-1 cursor-pointer transition-all h-[42px] flex flex-col justify-center ${
                              selectedTrait === `Reward: ${traits.rewardRate}` 
                                ? 'border-purple-500 bg-purple-900/50' 
                                : 'border-cyan-700/40 hover:border-purple-500'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTrait(`Reward: ${traits.rewardRate}`)
                            }}
                          >
                            <div className="text-cyan-400 font-semibold text-[8px] leading-tight">Reward</div>
                            <div className={`text-[9px] leading-tight overflow-hidden text-ellipsis line-clamp-2 ${
                              isUltraRareTrait('Reward Rate', traits.rewardRate) ? 'text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : isRareTrait('Reward Rate', traits.rewardRate) ? 'text-purple-300 font-semibold' : 'text-white'
                            }`}>{traits.rewardRate}</div>
                          </div>
                          <div 
                            className={`bg-gray-800/70 border-2 rounded p-1 cursor-pointer transition-all h-[42px] flex flex-col justify-center ${
                              selectedTrait === `Ability: ${traits.ability}` 
                                ? 'border-purple-500 bg-purple-900/50' 
                                : 'border-cyan-700/40 hover:border-purple-500'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTrait(`Ability: ${traits.ability}`)
                            }}
                          >
                            <div className="text-cyan-400 font-semibold text-[8px] leading-tight">Ability</div>
                            <div className={`font-medium text-[9px] leading-tight overflow-hidden text-ellipsis line-clamp-2 ${
                              isRareTrait('Ability', traits.ability) ? 'text-purple-300' : 'text-white'
                            }`}>{traits.ability}</div>
                          </div>
                          <div 
                            className={`bg-gray-800/70 border-2 rounded p-1 cursor-pointer transition-all h-[42px] flex flex-col justify-center ${
                              selectedTrait === `Strength: ${traits.strength}` 
                                ? 'border-purple-500 bg-purple-900/50' 
                                : 'border-cyan-700/40 hover:border-purple-500'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTrait(`Strength: ${traits.strength}`)
                            }}
                          >
                            <div className="text-cyan-400 font-semibold text-[8px] leading-tight">Strength</div>
                            <div className={`text-[9px] ${
                              isUltraRareTrait('Strength', traits.strength) ? 'text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : isRareTrait('Strength', traits.strength) ? 'text-purple-300 font-semibold' : 'text-white'
                            }`}>{traits.strength}</div>
                          </div>

                          <div 
                            className={`bg-gray-800/70 border-2 rounded p-1 cursor-pointer transition-all h-[42px] flex flex-col justify-center ${
                              selectedTrait === `Intelligence: ${traits.intelligence}` 
                                ? 'border-purple-500 bg-purple-900/50' 
                                : 'border-cyan-700/40 hover:border-purple-500'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTrait(`Intelligence: ${traits.intelligence}`)
                            }}
                          >
                            <div className="text-cyan-400 font-semibold text-[8px] leading-tight">Intelligence</div>
                            <div className={`text-[9px] ${
                              isUltraRareTrait('Intelligence', traits.intelligence) ? 'text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : isRareTrait('Intelligence', traits.intelligence) ? 'text-purple-300 font-semibold' : 'text-white'
                            }`}>{traits.intelligence}</div>
                          </div>
                          <div 
                            className={`bg-gray-800/70 border-2 rounded p-1 cursor-pointer transition-all h-[42px] flex flex-col justify-center ${
                              selectedTrait === `Cool: ${traits.cool}` 
                                ? 'border-purple-500 bg-purple-900/50' 
                                : 'border-cyan-700/40 hover:border-purple-500'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTrait(`Cool: ${traits.cool}`)
                            }}
                          >
                            <div className="text-cyan-400 font-semibold text-[8px] leading-tight">Cool</div>
                            <div className={`text-[9px] ${
                              isUltraRareTrait('Cool', traits.cool) ? 'text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : isRareTrait('Cool', traits.cool) ? 'text-purple-300 font-semibold' : 'text-white'
                            }`}>{traits.cool}</div>
                          </div>
                          <div 
                            className={`bg-gray-800/70 border-2 rounded p-1 cursor-pointer transition-all h-[42px] flex flex-col justify-center ${
                              selectedTrait === `Tech Skill: ${traits.techSkill}` 
                                ? 'border-purple-500 bg-purple-900/50' 
                                : 'border-cyan-700/40 hover:border-purple-500'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTrait(`Tech Skill: ${traits.techSkill}`)
                            }}
                          >
                            <div className="text-cyan-400 font-semibold text-[8px] leading-tight">Tech Skill</div>
                            <div className={`text-[9px] ${
                              isUltraRareTrait('Tech Skill', traits.techSkill) ? 'text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : isRareTrait('Tech Skill', traits.techSkill) ? 'text-purple-300 font-semibold' : 'text-white'
                            }`}>{traits.techSkill}</div>
                          </div>
                          <div 
                            className={`bg-gray-800/70 border-2 rounded p-1 cursor-pointer transition-all h-[42px] flex flex-col justify-center ${
                              selectedTrait === `Attractiveness: ${traits.attractiveness}` 
                                ? 'border-purple-500 bg-purple-900/50' 
                                : 'border-cyan-700/40 hover:border-purple-500'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTrait(`Attractiveness: ${traits.attractiveness}`)
                            }}
                          >
                            <div className="text-cyan-400 font-semibold text-[7px] leading-tight">Attractiveness</div>
                            <div className={`text-[9px] ${
                              isUltraRareTrait('Attractiveness', traits.attractiveness) ? 'text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : isRareTrait('Attractiveness', traits.attractiveness) ? 'text-purple-300 font-semibold' : 'text-white'
                            }`}>{traits.attractiveness}</div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Right Preview Card */}
              {(() => {
                const displayedCards = validCitizens.slice(0, 12)
                const currentIndex = displayedCards.findIndex(c => c.id === selectedCitizen)
                const nextIndex = currentIndex < displayedCards.length - 1 ? currentIndex + 1 : 0
                const nextCard = displayedCards[nextIndex]
                
                return (
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="w-[160px] opacity-50 hover:opacity-100 transition-all cursor-pointer hover:scale-105"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCitizen(nextCard.id)
                        setSelectedTrait(null)
                      }}
                    >
                      <img
                        src={`https://neo-tokyo.nyc3.cdn.digitaloceanspaces.com/s1Citizen/pngs/${nextCard.id}.png`}
                        alt={`Citizen ${nextCard.id}`}
                        className="w-full aspect-square object-cover rounded-xl border-2 border-cyan-600"
                      />
                    </div>
                    <div 
                      className="text-cyan-400 text-5xl leading-none select-none opacity-50 hover:opacity-100 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCitizen(nextCard.id)
                        setSelectedTrait(null)
                      }}
                    >
                      ›
                    </div>
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