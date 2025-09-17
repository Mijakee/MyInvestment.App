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
 * Reclassify suburbs based on improved logic
 */
export function reclassifySuburb(suburb: any): 'Urban' | 'Suburban' | 'Rural' {
  const lat = suburb.latitude
  const lng = suburb.longitude
  const name = suburb.sal_name.toLowerCase()

  // Perth CBD and immediate surrounds (Urban)
  // Very tight radius around Perth CBD
  const perthCBD = { lat: -31.9523, lng: 115.8613 }
  const distanceFromCBD = Math.sqrt(
    Math.pow((lat - perthCBD.lat) * 111, 2) +
    Math.pow((lng - perthCBD.lng) * 111 * Math.cos(lat * Math.PI / 180), 2)
  )

  // Urban: Within 8km of Perth CBD + specific urban centers
  if (distanceFromCBD <= 8) {
    if (name.includes('perth') || name.includes('northbridge') ||
        name.includes('subiaco') || name.includes('west perth') ||
        name.includes('east perth') || name.includes('leederville')) {
      return 'Urban'
    }
  }

  // Suburban: Perth Metropolitan Area
  // Defined as the greater Perth area within reasonable commuting distance
  const isInPerthMetro = (
    lat >= -32.5 && lat <= -31.0 &&  // North-South bounds of Perth metro
    lng >= 115.4 && lng <= 116.3     // East-West bounds of Perth metro
  ) ||
  // Major suburban centers by name
  name.includes('joondalup') || name.includes('rockingham') ||
  name.includes('mandurah') || name.includes('fremantle') ||
  name.includes('armadale') || name.includes('midland') ||
  name.includes('wanneroo') || name.includes('cockburn') ||
  name.includes('stirling') || name.includes('canning') ||
  name.includes('swan') || name.includes('gosnells') ||
  name.includes('belmont') || name.includes('bayswater') ||
  name.includes('kalamunda') || name.includes('mundaring')

  if (isInPerthMetro) {
    // Within metro area but not urban core = Suburban
    return 'Suburban'
  }

  // Everything else is Rural
  // This includes: Remote areas, Mining towns, Regional towns, Coastal areas, Agricultural areas
  return 'Rural'
}

/**
 * Get the reason for classification
 */
export function getClassificationReason(suburb: any, newClassification: string): string {
  const lat = suburb.latitude
  const lng = suburb.longitude
  const name = suburb.sal_name.toLowerCase()

  const perthCBD = { lat: -31.9523, lng: 115.8613 }
  const distanceFromCBD = Math.sqrt(
    Math.pow((lat - perthCBD.lat) * 111, 2) +
    Math.pow((lng - perthCBD.lng) * 111 * Math.cos(lat * Math.PI / 180), 2)
  )

  switch (newClassification) {
    case 'Urban':
      return `Within ${distanceFromCBD.toFixed(1)}km of Perth CBD, urban commercial/residential core`
    case 'Suburban':
      return `Perth metropolitan area, residential suburb (${distanceFromCBD.toFixed(1)}km from CBD)`
    case 'Rural':
      if (distanceFromCBD > 50) {
        return `Regional/remote area (${distanceFromCBD.toFixed(0)}km from Perth)`
      } else {
        return `Rural/semi-rural area near Perth (${distanceFromCBD.toFixed(1)}km from CBD)`
      }
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