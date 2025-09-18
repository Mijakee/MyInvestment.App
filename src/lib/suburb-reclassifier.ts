/**
 * Suburb Reclassification System
 * Fixes the suburb classification logic based on geographic and demographic criteria
 */

export interface ReclassifiedSuburb {
  sal_code: string
  sal_name: string
  old_classification: string
  new_classification: 'Urban' | 'Suburban' | 'Rural'
  reason: string
}

/**
 * Reclassify suburbs based on distance from Perth CBD
 */
export function reclassifySuburb(suburb: any): 'Urban' | 'Suburban' | 'Rural' {
  const lat = suburb.latitude
  const lng = suburb.longitude

  // Perth CBD coordinates
  const perthCBD = { lat: -31.9523, lng: 115.8613 }

  // Calculate distance from Perth CBD in kilometers
  const distanceFromCBD = Math.sqrt(
    Math.pow((lat - perthCBD.lat) * 111, 2) +
    Math.pow((lng - perthCBD.lng) * 111 * Math.cos(lat * Math.PI / 180), 2)
  )

  // Pure distance-based classification
  if (distanceFromCBD <= 10) {
    // Urban: Within 10km of Perth CBD (core metropolitan area)
    return 'Urban'
  } else if (distanceFromCBD <= 80) {
    // Suburban: 10-80km from Perth CBD (metropolitan area including coastal cities like Fremantle, Joondalup, Rockingham)
    return 'Suburban'
  } else {
    // Rural: Beyond 80km from Perth CBD (regional towns, mining areas, agricultural areas)
    return 'Rural'
  }
}

/**
 * Get the reason for classification
 */
export function getClassificationReason(suburb: any, newClassification: string): string {
  const lat = suburb.latitude
  const lng = suburb.longitude

  const perthCBD = { lat: -31.9523, lng: 115.8613 }
  const distanceFromCBD = Math.sqrt(
    Math.pow((lat - perthCBD.lat) * 111, 2) +
    Math.pow((lng - perthCBD.lng) * 111 * Math.cos(lat * Math.PI / 180), 2)
  )

  switch (newClassification) {
    case 'Urban':
      return `Within 10km of Perth CBD (${distanceFromCBD.toFixed(1)}km) - Urban core`
    case 'Suburban':
      return `10-80km from Perth CBD (${distanceFromCBD.toFixed(1)}km) - Metropolitan area incl. coastal cities`
    case 'Rural':
      return `Beyond 80km from Perth CBD (${distanceFromCBD.toFixed(0)}km) - Regional/rural area`
    default:
      return 'Unknown classification'
  }
}

/**
 * Analyze current vs proposed classifications
 */
export function analyzeReclassification(suburbs: any[]): {
  summary: Record<string, { current: number, proposed: number, changed: number }>
  changes: ReclassifiedSuburb[]
  unchanged: number
} {
  const summary: Record<string, { current: number, proposed: number, changed: number }> = {
    Urban: { current: 0, proposed: 0, changed: 0 },
    Suburban: { current: 0, proposed: 0, changed: 0 },
    Rural: { current: 0, proposed: 0, changed: 0 }
  }

  const changes: ReclassifiedSuburb[] = []
  let unchanged = 0

  for (const suburb of suburbs) {
    const oldClass = suburb.classification_type
    const newClass = reclassifySuburb(suburb)

    // Count current classifications
    if (summary[oldClass as keyof typeof summary]) {
      summary[oldClass as keyof typeof summary].current++
    }

    // Count proposed classifications
    summary[newClass].proposed++

    if (oldClass !== newClass) {
      // Count changes
      if (summary[oldClass as keyof typeof summary]) {
        summary[oldClass as keyof typeof summary].changed++
      }

      changes.push({
        sal_code: suburb.sal_code,
        sal_name: suburb.sal_name,
        old_classification: oldClass,
        new_classification: newClass,
        reason: getClassificationReason(suburb, newClass)
      })
    } else {
      unchanged++
    }
  }

  return { summary, changes, unchanged }
}