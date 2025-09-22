/**
 * Create Sample Precomputed Data
 * Generates a small sample of precomputed data for testing
 */

import { writeFileSync } from 'fs'
import { join } from 'path'
import { waSuburbLoader } from '../lib/wa-suburb-loader'
import type { PrecomputedDataFile, PrecomputedSuburbScore } from '../lib/precomputed-data-service'

// Create sample data for first 10 suburbs to test the system
const createSampleData = () => {
  console.log('🚀 Creating sample precomputed data...')

  const allSuburbs = waSuburbLoader.getAllSuburbs()
  const sampleSuburbs = allSuburbs.slice(0, 10) // First 10 suburbs

  const processedSuburbs: Record<string, PrecomputedSuburbScore> = {}

  sampleSuburbs.forEach(suburb => {
    // Generate consistent sample scores based on suburb characteristics
    const nameHash = suburb.sal_name.split('').reduce((hash: number, char: string) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff
    }, 0)
    const seedRandom = Math.abs(nameHash) / 0xffffffff

    // Generate realistic-looking scores
    const safetyScore = Math.round((5 + seedRandom * 4) * 10) / 10 // 5-9 range
    const crimeScore = Math.round((11 - safetyScore) * 10) / 10 // Inverse of safety
    const convenienceScore = Math.round((3 + seedRandom * 6) * 10) / 10 // 3-9 range
    const investmentScore = Math.round((safetyScore * 0.6 + convenienceScore * 0.4) * 10) / 10

    processedSuburbs[suburb.sal_code] = {
      sal_code: suburb.sal_code,
      sal_name: suburb.sal_name,
      coordinates: {
        latitude: suburb.latitude,
        longitude: suburb.longitude
      },
      scores: {
        safety: safetyScore,
        crime: crimeScore,
        convenience: convenienceScore,
        investment: investmentScore
      },
      raw_data: {
        transport_stops: Math.floor(seedRandom * 20),
        shopping_facilities: Math.floor(seedRandom * 15),
        schools: Math.floor(seedRandom * 8),
        health_facilities: Math.floor(seedRandom * 5)
      },
      metadata: {
        last_calculated: new Date().toISOString(),
        data_quality: 'high',
        confidence: Math.round((0.8 + seedRandom * 0.2) * 100) / 100
      }
    }

    console.log(`✅ ${suburb.sal_name}: Safety=${safetyScore}, Convenience=${convenienceScore}, Investment=${investmentScore}`)
  })

  const sampleData: PrecomputedDataFile = {
    _metadata: {
      version: '1.0.0-sample',
      last_updated: new Date().toISOString(),
      total_suburbs: Object.keys(processedSuburbs).length,
      data_sources: {
        wa_police_crime: 'sample-data',
        abs_census: '2021',
        transport_data: 'sample-data',
        facility_data: 'sample-data'
      },
      calculation_method: 'sample_consistent_algorithms',
      next_update_due: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    suburbs: processedSuburbs
  }

  const outputPath = join(process.cwd(), 'src/data/precomputed-suburb-scores.json')
  writeFileSync(outputPath, JSON.stringify(sampleData, null, 2))

  console.log(`\n🎉 Sample data created!`)
  console.log(`   📁 Saved to: ${outputPath}`)
  console.log(`   📊 Suburbs: ${Object.keys(processedSuburbs).length}`)
  console.log(`   🧪 Type: Sample data for testing`)

  return sampleData
}

// Run if called directly
if (require.main === module) {
  createSampleData()
}

export { createSampleData }