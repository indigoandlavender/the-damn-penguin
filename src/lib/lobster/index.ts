/**
 * Lobster - Cadastral Polygon Processing
 *
 * Utilities for processing geospatial data related to Moroccan
 * cadastral systems. Handles coordinate transformations, polygon
 * validation, and boundary calculations.
 */

import type { GeoPoint, GeoPolygon } from '@/types';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Morocco's approximate bounding box for coordinate validation
 * Used to detect obviously invalid coordinates
 */
const MOROCCO_BOUNDS = {
  minLat: 21.0,  // Southern border
  maxLat: 36.0,  // Northern border
  minLng: -17.0, // Western border (Atlantic)
  maxLng: -1.0,  // Eastern border (Algeria)
};

/**
 * Coordinate Reference System constants
 * Morocco uses Lambert Conformal Conic projections for cadastral work
 */
const CRS = {
  WGS84: 4326,           // GPS standard
  MOROCCO_LAMBERT: 26191, // Morocco Lambert Zone 1
};

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isValidGeoPoint(point: unknown): point is GeoPoint {
  if (!point || typeof point !== 'object') return false;
  const p = point as Record<string, unknown>;
  return (
    p.type === 'Point' &&
    Array.isArray(p.coordinates) &&
    p.coordinates.length === 2 &&
    typeof p.coordinates[0] === 'number' &&
    typeof p.coordinates[1] === 'number'
  );
}

export function isValidGeoPolygon(polygon: unknown): polygon is GeoPolygon {
  if (!polygon || typeof polygon !== 'object') return false;
  const p = polygon as Record<string, unknown>;
  if (p.type !== 'Polygon' || !Array.isArray(p.coordinates)) return false;

  // Must have at least one ring
  if (p.coordinates.length === 0) return false;

  // Each ring must be an array of coordinate pairs
  for (const ring of p.coordinates) {
    if (!Array.isArray(ring) || ring.length < 4) return false;
    for (const coord of ring) {
      if (!Array.isArray(coord) || coord.length !== 2) return false;
      if (typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
        return false;
      }
    }
    // Ring must be closed (first coord === last coord)
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) return false;
  }

  return true;
}

// =============================================================================
// COORDINATE VALIDATION
// =============================================================================

/**
 * Check if coordinates fall within Morocco's bounding box
 */
export function isWithinMorocco(lat: number, lng: number): boolean {
  return (
    lat >= MOROCCO_BOUNDS.minLat &&
    lat <= MOROCCO_BOUNDS.maxLat &&
    lng >= MOROCCO_BOUNDS.minLng &&
    lng <= MOROCCO_BOUNDS.maxLng
  );
}

/**
 * Validate GPS coordinates from field capture
 */
export function validateGPSCapture(
  lat: number,
  lng: number,
  accuracy: number
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Check basic coordinate validity
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { valid: false, warnings: ['Invalid coordinate range'] };
  }

  // Check if within Morocco
  if (!isWithinMorocco(lat, lng)) {
    warnings.push('Coordinates outside Morocco bounds');
  }

  // Check accuracy threshold (warn if > 10m, reject if > 50m)
  if (accuracy > 50) {
    return { valid: false, warnings: ['GPS accuracy too low (>50m)'] };
  }
  if (accuracy > 10) {
    warnings.push(`GPS accuracy warning: ${accuracy.toFixed(1)}m`);
  }

  return { valid: true, warnings };
}

// =============================================================================
// GEOMETRY UTILITIES
// =============================================================================

/**
 * Create a GeoJSON Point from coordinates
 */
export function createGeoPoint(lng: number, lat: number): GeoPoint {
  return {
    type: 'Point',
    coordinates: [lng, lat],
  };
}

/**
 * Create a GeoJSON Polygon from coordinate array
 * Automatically closes the ring if not already closed
 */
export function createGeoPolygon(
  coordinates: Array<[number, number]>
): GeoPolygon {
  // Ensure ring is closed
  const ring = [...coordinates];
  const first = ring[0];
  const last = ring[ring.length - 1];

  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push(first);
  }

  return {
    type: 'Polygon',
    coordinates: [ring],
  };
}

/**
 * Calculate approximate area of a polygon in square meters
 * Uses Shoelace formula with spherical correction
 */
export function calculatePolygonArea(polygon: GeoPolygon): number {
  const ring = polygon.coordinates[0];
  if (ring.length < 4) return 0;

  // Approximate meters per degree at Morocco's latitude (~32°N)
  const metersPerDegreeLat = 111132;
  const metersPerDegreeLng = 94000; // cos(32°) * 111320

  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];

    // Convert to meters
    const x1m = x1 * metersPerDegreeLng;
    const y1m = y1 * metersPerDegreeLat;
    const x2m = x2 * metersPerDegreeLng;
    const y2m = y2 * metersPerDegreeLat;

    area += x1m * y2m - x2m * y1m;
  }

  return Math.abs(area) / 2;
}

/**
 * Calculate centroid of a polygon
 */
export function calculateCentroid(polygon: GeoPolygon): GeoPoint {
  const ring = polygon.coordinates[0];
  let sumLng = 0;
  let sumLat = 0;
  const n = ring.length - 1; // Exclude closing point

  for (let i = 0; i < n; i++) {
    sumLng += ring[i][0];
    sumLat += ring[i][1];
  }

  return {
    type: 'Point',
    coordinates: [sumLng / n, sumLat / n],
  };
}

/**
 * Calculate bounding box of a polygon
 */
export function calculateBoundingBox(
  polygon: GeoPolygon
): { minLng: number; maxLng: number; minLat: number; maxLat: number } {
  const ring = polygon.coordinates[0];

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of ring) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  return { minLng, maxLng, minLat, maxLat };
}

// =============================================================================
// POSTGIS UTILITIES
// =============================================================================

/**
 * Convert GeoJSON Point to PostGIS geography string
 */
export function geoPointToPostGIS(point: GeoPoint): string {
  const [lng, lat] = point.coordinates;
  return `SRID=${CRS.WGS84};POINT(${lng} ${lat})`;
}

/**
 * Convert GeoJSON Polygon to PostGIS geography string
 */
export function geoPolygonToPostGIS(polygon: GeoPolygon): string {
  const rings = polygon.coordinates.map((ring) =>
    ring.map((coord) => `${coord[0]} ${coord[1]}`).join(',')
  );
  return `SRID=${CRS.WGS84};POLYGON((${rings.join('),(')}))`;
}

/**
 * Parse PostGIS POINT to GeoJSON
 */
export function postGISPointToGeo(wkt: string): GeoPoint | null {
  const match = wkt.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/i);
  if (!match) return null;

  return {
    type: 'Point',
    coordinates: [parseFloat(match[1]), parseFloat(match[2])],
  };
}

// =============================================================================
// CADASTRAL ZONE UTILITIES
// =============================================================================

/**
 * Morocco cadastral zone prefixes by region
 */
const CADASTRAL_PREFIXES: Record<string, string[]> = {
  'marrakech-safi': ['MS', 'MR'],
  'souss-massa': ['SM', 'AG'],
  'draa-tafilalet': ['DT', 'OZ', 'ER'],
  'casablanca-settat': ['CS', 'CA'],
  'rabat-sale-kenitra': ['RS', 'RB'],
  'tanger-tetouan-al-hoceima': ['TT', 'TN'],
  'fes-meknes': ['FM', 'FE'],
};

/**
 * Validate cadastral zone format
 */
export function isValidCadastralZone(zone: string): boolean {
  // Format: XX-NNNN-NNN (Region-Section-Parcel)
  return /^[A-Z]{2}-\d{4}-\d{3}$/.test(zone);
}

/**
 * Extract region from cadastral zone
 */
export function getCadastralRegion(zone: string): string | null {
  if (!isValidCadastralZone(zone)) return null;
  const prefix = zone.slice(0, 2);

  for (const [region, prefixes] of Object.entries(CADASTRAL_PREFIXES)) {
    if (prefixes.includes(prefix)) return region;
  }

  return null;
}

// =============================================================================
// EXPORTS
// =============================================================================

export { MOROCCO_BOUNDS, CRS, CADASTRAL_PREFIXES };
