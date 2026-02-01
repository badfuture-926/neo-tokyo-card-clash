// Script to fetch all Neo Tokyo Citizens traits and calculate rarity
// Run with: node fetchRarity.js

import fs from 'fs';

const ALCHEMY_API_KEY = '0uBM1JotEbL5ERgVwcDEa';
const CONTRACT_ADDRESS = '0xb9951b43802dcf3ef5b14567cb17adf367ed1c0f';
const TOTAL_SUPPLY = 2133;

// Track trait counts
const traitCounts = {};

async function fetchCitizenTraits(tokenId) {
  try {
    const url = `https://eth-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}/getNFTMetadata?contractAddress=${CONTRACT_ADDRESS}&tokenId=${tokenId}&refreshCache=false`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`Failed to fetch token ${tokenId}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const attributes = data.raw?.metadata?.attributes || data.metadata?.attributes || [];
    
    return attributes;
  } catch (error) {
    console.error(`Error fetching token ${tokenId}:`, error.message);
    return null;
  }
}

async function analyzeAllCitizens() {
  console.log('Starting to fetch all citizens...');
  console.log('This will take a while (2133 API calls)...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (let tokenId = 1; tokenId <= 4000; tokenId++) {
    // Progress indicator every 100 tokens
    if (tokenId % 100 === 0) {
      console.log(`Progress: ${tokenId}/4000 checked, ${successCount} valid citizens found`);
    }
    
    const attributes = await fetchCitizenTraits(tokenId);
    
    if (!attributes || attributes.length === 0) {
      failCount++;
      continue;
    }
    
    successCount++;
    
    // Count each trait
    attributes.forEach(attr => {
      const traitType = attr.trait_type;
      const value = String(attr.value);
      
      if (!traitCounts[traitType]) {
        traitCounts[traitType] = {};
      }
      
      if (!traitCounts[traitType][value]) {
        traitCounts[traitType][value] = 0;
      }
      
      traitCounts[traitType][value]++;
    });
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log(`\n✅ Complete!`);
  console.log(`Valid citizens found: ${successCount}`);
  console.log(`Failed fetches: ${failCount}`);
  
  // Calculate percentages and determine rare traits (< 5% occurrence)
  const rareTraits = {};
  
  Object.keys(traitCounts).forEach(traitType => {
    rareTraits[traitType] = [];
    
    Object.entries(traitCounts[traitType]).forEach(([value, count]) => {
      const percentage = (count / successCount) * 100;
      
      // Mark as rare if less than 5% of collection has it
      if (percentage < 5) {
        rareTraits[traitType].push({
          value,
          count,
          percentage: percentage.toFixed(2)
        });
      }
    });
    
    // Sort by rarity (lowest count first)
    rareTraits[traitType].sort((a, b) => a.count - b.count);
  });
  
  // Save full trait counts
  fs.writeFileSync(
    'traitCounts.json',
    JSON.stringify(traitCounts, null, 2)
  );
  
  // Save rare traits list
  fs.writeFileSync(
    'rareTraits.json',
    JSON.stringify(rareTraits, null, 2)
  );
  
  console.log('\n📊 Files created:');
  console.log('- traitCounts.json (all trait counts)');
  console.log('- rareTraits.json (traits with <5% occurrence)');
  
  // Print some examples
  console.log('\n🔥 Examples of rare traits:');
  Object.entries(rareTraits).forEach(([traitType, values]) => {
    if (values.length > 0) {
      console.log(`\n${traitType}:`);
      values.slice(0, 3).forEach(trait => {
        console.log(`  - ${trait.value}: ${trait.count} (${trait.percentage}%)`);
      });
    }
  });
}

// Run the script
analyzeAllCitizens().catch(console.error);
