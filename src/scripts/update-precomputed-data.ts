/**
 * Data Update Script
 * Run this script every 6 months to refresh precomputed suburb scores
 * Usage: npm run update-data
 */

import { writeFileSync } from 'fs'
import { join } from 'path'
import { waSuburbLoader } from '../lib/wa-suburb-loader'
import { crimeScoreService } from '../lib/data-sources/safety-rating-service'
import { convenienceScoreService } from '../lib/data-sources/convenience-score-service'
import type { PrecomputedDataFile, PrecomputedSuburbScore } from '../lib/precomputed-data-service'

class DataUpdateScript {
  private readonly OUTPUT_PATH = join(process.cwd(), 'src/data/precomputed-suburb-scores.json')

  async updateAllData() {
    console.log('🚀 Starting precomputed data update process...')
    const startTime = Date.now()

    try {
      // Get all suburbs
      const allSuburbs = waSuburbLoader.getAllSuburbs()
      console.log(`Processing ${allSuburbs.length} suburbs...`)

      const processedSuburbs: Record<string, PrecomputedSuburbScore> = {}
      let successCount = 0
      let failCount = 0

      // Process suburbs in smaller batches to avoid overwhelming external APIs
      const batchSize = 10
      for (let i = 0; i < allSuburbs.length; i += batchSize) {
        const batch = allSuburbs.slice(i, i + batchSize)

        console.log(`\n📊 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allSuburbs.length/batchSize)} (suburbs ${i+1}-${Math.min(i+batchSize, allSuburbs.length)})`)

        // Process batch in parallel for speed
        const batchPromises = batch.map(suburb => this.processSuburb(suburb))
        const batchResults = await Promise.allSettled(batchPromises)

        // Collect results
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            processedSuburbs[result.value.sal_code] = result.value
            successCount++
            console.log(`  ✅ ${batch[index].sal_name}: S=${result.value.scores.safety}, C=${result.value.scores.convenience}`)
          } else {
            failCount++
            console.log(`  ❌ ${batch[index].sal_name}: Failed - ${result.status === 'rejected' ? result.reason : 'Unknown error'}`)
          }
        })

        // Small delay between batches to be respectful to external APIs
        if (i + batchSize < allSuburbs.length) {
          console.log('   ⏱️  Waiting 2 seconds before next batch...')
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }

      // Create final data structure
      const precomputedData: PrecomputedDataFile = {
        _metadata: {
          version: '1.0.0',
          last_updated: new Date().toISOString(),
          total_suburbs: successCount,
          data_sources: {
            wa_police_crime: new Date().toISOString().split('T')[0],
            abs_census: '2021',
            transperth_gtfs: '2024-01-04',
            convenience_static_data: new Date().toISOString().split('T')[0]
          },
          calculation_method: 'real_static_data_algorithms',
          next_update_due: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString() // 6 months from now
        },
        suburbs: processedSuburbs
      }

      // Save to file
      writeFileSync(this.OUTPUT_PATH, JSON.stringify(precomputedData, null, 2))

      const processingTime = (Date.now() - startTime) / 1000
      console.log(`\n🎉 Data update completed!`)
      console.log(`   ✅ Successful: ${successCount} suburbs`)
      console.log(`   ❌ Failed: ${failCount} suburbs`)
      console.log(`   ⏱️  Total time: ${processingTime.toFixed(1)}s`)
      console.log(`   📁 Saved to: ${this.OUTPUT_PATH}`)
      console.log(`   📅 Next update due: ${precomputedData._metadata.next_update_due.split('T')[0]}`)

      return precomputedData

    } catch (error) {
      console.error('💥 Data update failed:', error)
      throw error
    }
  }

  private async processSuburb(suburb: any): Promise<PrecomputedSuburbScore | null> {
    try {
      // Calculate safety score using real algorithm
      const safetyData = await crimeScoreService.calculateSafetyRating(suburb.sal_code)

      // Calculate convenience score using static data
      const convenienceData = await convenienceScoreService.calculateConvenienceScore(
        suburb.latitude,
        suburb.longitude
      )

      // Require valid convenience data - no more fallbacks to geographic defaults
      if (!convenienceData) {
        throw new Error(`Convenience calculation failed for ${suburb.sal_name} - no fallback data available`)
      }

      const convenienceScore = convenienceData.overallScore
      const transportStops = convenienceData.components.transport?.nearbyStops || 0
      const shoppingFacilities = convenienceData.components.shopping?.nearbyFacilities || 0
      const schools = convenienceData.components.education?.nearbySchools || 0
      const healthFacilities = convenienceData.components.medical?.nearbyFacilities || 0

      // Calculate investment score (combination of safety + convenience)
      const investmentScore = Math.round((safetyData.overallRating * 0.6 + convenienceScore * 0.4) * 10) / 10

      return {
        sal_code: suburb.sal_code,
        sal_name: suburb.sal_name,
        coordinates: {
          latitude: suburb.latitude,
          longitude: suburb.longitude
        },
        scores: {
          safety: Math.round(safetyData.overallRating * 10) / 10,
          crime: Math.round(safetyData.components.crimeRating * 10) / 10,
          convenience: Math.round(convenienceScore * 10) / 10,
          investment: investmentScore
        },
        raw_data: {
          transport_stops: transportStops,
          shopping_facilities: shoppingFacilities,
          schools: schools,
          health_facilities: healthFacilities
        },
        metadata: {
          last_calculated: new Date().toISOString(),
          data_quality: (safetyData.confidence > 0.8 && convenienceData.confidence > 0.8) ? 'high' :
                       (safetyData.confidence > 0.5 && convenienceData.confidence > 0.5) ? 'medium' : 'low',
          confidence: Math.round((safetyData.confidence + convenienceData.confidence) / 2 * 100) / 100
        }
      }

    } catch (error) {
      console.error(`Failed to process suburb ${suburb.sal_code} (${suburb.sal_name}):`, error)
      return null
    }
  }

  /**
   * Update specific suburbs only (for incremental updates)
   */
  async updateSpecificSuburbs(salCodes: string[]) {
    console.log(`🔄 Updating specific suburbs: ${salCodes.join(', ')}`)

    // Load existing data
    const existingData = require(this.OUTPUT_PATH) as PrecomputedDataFile

    // Update specific suburbs
    for (const salCode of salCodes) {
      const suburb = waSuburbLoader.getSuburbBySALCode(salCode)
      if (suburb) {
        const updatedSuburb = await this.processSuburb(suburb)
        if (updatedSuburb) {
          existingData.suburbs[salCode] = updatedSuburb
          console.log(`✅ Updated ${suburb.sal_name}`)
        }
      }
    }

    // Update metadata
    existingData._metadata.last_updated = new Date().toISOString()

    // Save updated data
    writeFileSync(this.OUTPUT_PATH, JSON.stringify(existingData, null, 2))
    console.log('✅ Specific suburbs updated successfully')
  }
}

// Export for use in API endpoints or manual running
export const dataUpdateScript = new DataUpdateScript()

// Allow running directly
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.includes('--specific') && args.length > 1) {
    // Update specific suburbs
    const salCodes = args.filter(arg => arg !== '--specific')
    dataUpdateScript.updateSpecificSuburbs(salCodes)
      .catch(console.error)
  } else {
    // Full update
    dataUpdateScript.updateAllData()
      .catch(console.error)
  }
}