/**
 * Create Enhanced Precomputed Data
 * Generates precomputed data using the enhanced convenience scoring system
 * with comprehensive facility data (38,862 facilities)
 */

import { writeFileSync } from 'fs'
import { join } from 'path'
import { waSuburbLoader } from '../lib/wa-suburb-loader'
import { enhancedConvenienceScoreService } from '../lib/enhanced-convenience-score-service'
import { safetyRatingService } from '../lib/safety-rating-service'
import type { PrecomputedDataFile, PrecomputedSuburbScore } from '../lib/precomputed-data-service'

// Create enhanced precomputed data using real enhanced convenience scoring
const createEnhancedPrecomputedData = async () => {
  console.log('🚀 Creating enhanced precomputed data with comprehensive facility scoring...')
  console.log('📊 Using 38,862 facility dataset (Shopping, Groceries, Health, Pharmacies, Leisure, Parks)')

  const allSuburbs = waSuburbLoader.getAllSuburbs()
  const processedSuburbs: Record<string, PrecomputedSuburbScore> = {}

  // Process suburbs in smaller batches to avoid overwhelming the system
  const BATCH_SIZE = 50
  const totalBatches = Math.ceil(allSuburbs.length / BATCH_SIZE)

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const startIndex = batchIndex * BATCH_SIZE
    const endIndex = Math.min(startIndex + BATCH_SIZE, allSuburbs.length)
    const batch = allSuburbs.slice(startIndex, endIndex)

    console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} suburbs)`)

    for (const suburb of batch) {
      try {
        // Calculate enhanced convenience score using comprehensive facility data
        const enhancedScore = await enhancedConvenienceScoreService.calculateEnhancedConvenienceScore(
          suburb.latitude,
          suburb.longitude
        )

        // Calculate safety rating (this will use existing safety calculation system)
        let safetyScore = 7.0 // Default fallback
        try {
          const safetyRating = await safetyRatingService.calculateSafetyRating(suburb.sal_code)
          if (safetyRating.success && typeof safetyRating.data.overall_rating === 'number') {
            safetyScore = safetyRating.data.overall_rating
          }
        } catch (safetyError) {
          console.warn(`   ⚠️ Safety calculation failed for ${suburb.sal_name}, using fallback`)
        }

        // Calculate crime score (inverse of safety)
        const crimeScore = Math.round((11 - safetyScore) * 10) / 10

        // Calculate combined investment score (Safety 60% + Convenience 40%)
        const investmentScore = Math.round((safetyScore * 0.6 + enhancedScore.overallScore * 0.4) * 10) / 10

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
            convenience: enhancedScore.overallScore,
            investment: investmentScore
          },
          raw_data: {
            transport_stops: enhancedScore.components.transport.nearbyStops,
            shopping_facilities: enhancedScore.components.shopping.nearbyShoppingCentres + enhancedScore.components.shopping.nearbyGroceries,
            schools: 0, // Not included in current enhanced scoring
            health_facilities: enhancedScore.components.health.nearbyHealthCare + enhancedScore.components.health.nearbyPharmacies,
            recreation_facilities: enhancedScore.components.recreation.nearbyParks + enhancedScore.components.recreation.nearbyLeisureCentres,
            enhanced_components: {
              shopping_score: enhancedScore.components.shopping.score,
              health_score: enhancedScore.components.health.score,
              recreation_score: enhancedScore.components.recreation.score,
              transport_score: enhancedScore.components.transport.score,
              beach_access: enhancedScore.components.recreation.beachAccess
            }
          },
          metadata: {
            last_calculated: new Date().toISOString(),
            data_quality: 'high',
            confidence: enhancedScore.confidence,
            enhanced_scoring: true,
            facility_count: enhancedScore.components.shopping.facilitiesWithin5km +
                           enhancedScore.components.health.facilitiesWithin10km +
                           enhancedScore.components.recreation.facilitiesWithin2km,
            algorithm_version: '1.0-enhanced'
          }
        }

        console.log(`   ✅ ${suburb.sal_name}: Safety=${safetyScore}, Enhanced Convenience=${enhancedScore.overallScore}, Investment=${investmentScore}`)

        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 10))

      } catch (error) {
        console.error(`   ❌ Failed to process ${suburb.sal_name}:`, error)

        // Create fallback entry with reasonable defaults
        processedSuburbs[suburb.sal_code] = {
          sal_code: suburb.sal_code,
          sal_name: suburb.sal_name,
          coordinates: {
            latitude: suburb.latitude,
            longitude: suburb.longitude
          },
          scores: {
            safety: 5.0,
            crime: 6.0,
            convenience: 5.0,
            investment: 5.0
          },
          raw_data: {
            transport_stops: 0,
            shopping_facilities: 0,
            schools: 0,
            health_facilities: 0,
            recreation_facilities: 0
          },
          metadata: {
            last_calculated: new Date().toISOString(),
            data_quality: 'low',
            confidence: 0.3,
            enhanced_scoring: false,
            error: 'Calculation failed, using fallback values'
          }
        }
      }
    }

    // Log batch progress
    const processedCount = Object.keys(processedSuburbs).length
    console.log(`   📊 Batch complete. Total processed: ${processedCount}/${allSuburbs.length}`)
  }

  const enhancedData: PrecomputedDataFile = {
    _metadata: {
      version: '2.0.0-enhanced',
      last_updated: new Date().toISOString(),
      total_suburbs: Object.keys(processedSuburbs).length,
      data_sources: {
        wa_police_crime: 'real-excel-data',
        abs_census: '2021',
        transport_data: 'gtfs-static',
        facility_data: 'comprehensive-osm-static',
        shopping_centres: '143 facilities',
        groceries: '4,894 facilities',
        health_care: '1,653 facilities',
        pharmacies: '24,452 facilities',
        leisure_centres: '1,540 facilities',
        parks: '6,180 facilities'
      },
      calculation_method: 'enhanced_convenience_scoring_v1.0',
      scoring_algorithm: {
        convenience: 'Shopping(30%) + Health(25%) + Recreation(25%) + Transport(20%)',
        investment: 'Safety(60%) + Convenience(40%)',
        total_facilities: 38862
      },
      next_update_due: new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      performance_optimized: 'Static data eliminates API rate limits'
    },
    suburbs: processedSuburbs
  }

  const outputPath = join(process.cwd(), 'src/data/precomputed-suburb-scores-enhanced.json')
  writeFileSync(outputPath, JSON.stringify(enhancedData, null, 2))

  console.log(`\n🎉 Enhanced precomputed data created!`)
  console.log(`   📁 Saved to: ${outputPath}`)
  console.log(`   📊 Suburbs: ${Object.keys(processedSuburbs).length}`)
  console.log(`   🏢 Total facilities used: 38,862`)
  console.log(`   🎯 Enhancement: Real comprehensive facility data`)
  console.log(`   🚀 Performance: No API rate limits`)
  console.log(`   📈 Quality: Enhanced convenience scoring with 6 facility types`)

  return enhancedData
}

// Run if called directly
if (require.main === module) {
  createEnhancedPrecomputedData()
    .then(() => {
      console.log('\n✅ Enhanced precomputed data generation completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Enhanced precomputed data generation failed:', error)
      process.exit(1)
    })
}

export { createEnhancedPrecomputedData }