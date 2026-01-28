/**
 * The Damn Penguin - Core Type Definitions
 * Institutional Real Estate Intelligence Platform
 */

// =============================================================================
// ENUMS
// =============================================================================

export type LegalStatus = 'Titled' | 'In-Process' | 'Melkia';

export type CharterCategory = 'A' | 'B' | 'C';

export type AuditEventType =
  | 'creation'
  | 'field_verification'
  | 'document_upload'
  | 'cadastral_match'
  | 'legal_status_change'
  | 'charter_assessment'
  | 'external_validation';

export type DocumentVerificationStatus = 'pending' | 'verified' | 'rejected';

// Regional Classifications
export type InvestmentRegion =
  | 'Marrakech-Safi'
  | 'Fes-Meknes'
  | 'Casablanca-Settat'
  | 'Rabat-Sale-Kenitra'
  | 'Tanger-Tetouan'
  | 'Souss-Massa'
  | 'Draa-Tafilalet'
  | 'Other';

export type CityClassification =
  | 'Marrakech'
  | 'Essaouira'
  | 'Fes'
  | 'Casablanca'
  | 'Rabat'
  | 'Tangier'
  | 'Agadir'
  | 'Ouarzazate'
  | 'Meknes'
  | 'Other';

// Confidence breakdown
export type VerificationStatus = 'OK' | 'PENDING' | 'FAILED' | 'NOT_APPLICABLE';

// =============================================================================
// GEOSPATIAL TYPES
// =============================================================================

export interface GeoPoint {
  type: 'Point';
  coordinates: [longitude: number, latitude: number];
}

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: Array<Array<[longitude: number, latitude: number]>>;
}

// =============================================================================
// CONFIDENCE BREAKDOWN
// =============================================================================

export interface ConfidenceBreakdown {
  cadastre: VerificationStatus;
  heirs: VerificationStatus;
  encumbrance: VerificationStatus;
  occupation: VerificationStatus;
}

// =============================================================================
// AUDIT TRAIL
// =============================================================================

export interface AuditEvent {
  timestamp: string;
  event_type: AuditEventType;
  user_id: string | null;
  data: {
    source?: string;
    decree_number?: string;
    reference_url?: string;
    notes?: string;
    previous_value?: unknown;
    new_value?: unknown;
    [key: string]: unknown;
  };
}

// =============================================================================
// PROPERTY ENTITY
// =============================================================================

export interface Property {
  id: string;

  // Legal Identifiers
  title_number: string | null;
  requisition_number: string | null;
  melkia_reference: string | null;

  // Legal Status
  legal_status: LegalStatus;
  legal_confidence_score: number | null;

  // Confidence Breakdown
  cadastre_status: VerificationStatus;
  heirs_status: VerificationStatus;
  encumbrance_status: VerificationStatus;
  occupation_status: VerificationStatus;

  // Geospatial
  gps_point: GeoPoint | null;
  boundary_polygon: GeoPolygon | null;
  cadastral_zone: string | null;

  // Regional Classification
  region: InvestmentRegion | null;
  city: CityClassification | null;
  neighborhood: string | null;
  street_address: string | null;

  // 2026 Investment Charter
  charter_category: CharterCategory | null;
  charter_score: number | null;
  charter_eligible: boolean;
  estimated_cashback_pct: number | null;

  // Valuation
  acquisition_price_mad: number | null;
  estimated_value_mad: number | null;
  price_per_sqm_mad: number | null;
  surface_sqm: number | null;
  net_acquisition_cost_mad: number | null; // After charter cashback

  // Property Details
  property_type: string | null;
  construction_year: number | null;
  rooms: number | null;
  floors: number | null;

  // Audit
  audit_trail: AuditEvent[];

  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface PropertyDocument {
  id: string;
  property_id: string;

  document_type: string;
  file_path: string;
  file_hash: string | null;

  source_reference: string | null;
  verification_status: DocumentVerificationStatus;

  captured_at: string | null;
  captured_gps: GeoPoint | null;

  metadata: Record<string, unknown>;
  created_at: string;
}

export interface FieldScout {
  id: string;
  property_id: string;

  scout_user_id: string | null;
  scout_timestamp: string;

  gps_accuracy_meters: number | null;
  device_info: {
    user_agent?: string;
    platform?: string;
    [key: string]: unknown;
  } | null;

  notes: string | null;
  photos_captured: number;

  created_at: string;
}

// =============================================================================
// CHARTER CALCULATOR TYPES
// =============================================================================

export interface CharterCalculationInput {
  acquisition_price_mad: number;
  charter_category: CharterCategory;
  is_renovation: boolean;
  renovation_cost_mad?: number;
  employment_created?: number;
}

export interface CharterCalculationResult {
  base_cashback_pct: number;
  bonus_pct: number;
  total_cashback_pct: number;
  estimated_cashback_mad: number;
  eligible_investment_mad: number;
  decree_reference: string;
}

// =============================================================================
// DASHBOARD TYPES
// =============================================================================

export interface PortfolioSummary {
  total_properties: number;
  total_value_mad: number;
  by_legal_status: Record<LegalStatus, number>;
  by_charter_category: Record<CharterCategory, number>;
  by_region: Record<InvestmentRegion, number>;
  by_city: Record<CityClassification, number>;
  average_legal_confidence: number;
  total_potential_cashback_mad: number;
  total_net_acquisition_cost_mad: number;
}

export interface RegionalSummary {
  region: InvestmentRegion;
  city: CityClassification;
  property_count: number;
  total_value_mad: number;
  avg_confidence: number;
  titled_count: number;
  in_process_count: number;
  melkia_count: number;
  total_net_cost_mad: number;
  total_charter_savings_mad: number;
}

export interface DashboardFilters {
  legal_status?: LegalStatus[];
  charter_category?: CharterCategory[];
  region?: InvestmentRegion[];
  city?: CityClassification[];
  min_confidence?: number;
  search?: string;
}

// =============================================================================
// SCOUT TYPES
// =============================================================================

export interface ScoutCapture {
  gps: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  };
  photos: Array<{
    blob: Blob;
    timestamp: number;
  }>;
  notes: string;
  device_info: {
    user_agent: string;
    platform: string;
  };
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T> {
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}
