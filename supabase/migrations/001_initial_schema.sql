-- The Damn Penguin: Initial Schema
-- Institutional Real Estate Intelligence Platform - Morocco 2026

-- =============================================================================
-- EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CUSTOM TYPES
-- =============================================================================
CREATE TYPE legal_status AS ENUM (
  'Titled',      -- Full freehold title (Titre Foncier)
  'In-Process',  -- Title registration in progress (Réquisition)
  'Melkia'       -- Traditional ownership (requires conversion)
);

CREATE TYPE charter_category AS ENUM (
  'A',  -- Primary zones: Marrakech, Casablanca, Rabat, Tangier (10% cashback)
  'B',  -- Secondary zones: Essaouira, Ouarzazate, Agadir, Fes (15% cashback)
  'C'   -- Emerging zones: Other regions (20% cashback)
);

CREATE TYPE audit_event_type AS ENUM (
  'creation',
  'field_verification',
  'document_upload',
  'cadastral_match',
  'legal_status_change',
  'charter_assessment',
  'external_validation'
);

-- =============================================================================
-- PROPERTIES TABLE
-- =============================================================================
CREATE TABLE properties (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Legal Identifiers
  title_number VARCHAR(50) UNIQUE,
  requisition_number VARCHAR(50),
  melkia_reference VARCHAR(100),

  -- Legal Status
  legal_status legal_status NOT NULL DEFAULT 'Melkia',
  legal_confidence_score NUMERIC(5,2) CHECK (legal_confidence_score >= 0 AND legal_confidence_score <= 100),

  -- Geospatial Data (PostGIS)
  gps_point geography(POINT, 4326),
  boundary_polygon geography(POLYGON, 4326),
  cadastral_zone VARCHAR(20),

  -- 2026 Investment Charter
  charter_category charter_category,
  charter_score NUMERIC(5,2) CHECK (charter_score >= 0 AND charter_score <= 100),
  charter_eligible BOOLEAN DEFAULT false,
  estimated_cashback_pct NUMERIC(5,2),

  -- Valuation
  acquisition_price_mad NUMERIC(15,2),
  estimated_value_mad NUMERIC(15,2),
  price_per_sqm_mad NUMERIC(10,2),
  surface_sqm NUMERIC(10,2),

  -- Audit Trail (JSONB for flexibility)
  audit_trail JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- =============================================================================
-- PROPERTY DOCUMENTS TABLE
-- =============================================================================
CREATE TABLE property_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

  document_type VARCHAR(50) NOT NULL,
  file_path TEXT NOT NULL,
  file_hash VARCHAR(64), -- SHA-256 for integrity verification

  source_reference TEXT,  -- Decree number, official reference
  verification_status VARCHAR(20) DEFAULT 'pending',

  captured_at TIMESTAMPTZ,
  captured_gps geography(POINT, 4326),

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- FIELD SCOUTS TABLE
-- =============================================================================
CREATE TABLE field_scouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

  scout_user_id UUID REFERENCES auth.users(id),
  scout_timestamp TIMESTAMPTZ DEFAULT NOW(),

  gps_accuracy_meters NUMERIC(6,2),
  device_info JSONB,

  notes TEXT,
  photos_captured INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================
-- Geospatial indexes for efficient polygon queries
CREATE INDEX idx_properties_gps_point ON properties USING GIST (gps_point);
CREATE INDEX idx_properties_boundary_polygon ON properties USING GIST (boundary_polygon);

-- Legal status for dashboard filtering
CREATE INDEX idx_properties_legal_status ON properties (legal_status);
CREATE INDEX idx_properties_charter_category ON properties (charter_category);

-- Audit trail GIN index for JSONB queries
CREATE INDEX idx_properties_audit_trail ON properties USING GIN (audit_trail);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to append audit events
CREATE OR REPLACE FUNCTION append_audit_event(
  p_property_id UUID,
  p_event_type audit_event_type,
  p_event_data JSONB,
  p_user_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE properties
  SET
    audit_trail = audit_trail || jsonb_build_object(
      'timestamp', NOW(),
      'event_type', p_event_type,
      'user_id', p_user_id,
      'data', p_event_data
    ),
    updated_at = NOW(),
    updated_by = p_user_id
  WHERE id = p_property_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate legal confidence based on status and documents
CREATE OR REPLACE FUNCTION calculate_legal_confidence(p_property_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_status legal_status;
  v_doc_count INTEGER;
  v_base_score NUMERIC;
BEGIN
  SELECT legal_status INTO v_status FROM properties WHERE id = p_property_id;
  SELECT COUNT(*) INTO v_doc_count FROM property_documents
    WHERE property_id = p_property_id AND verification_status = 'verified';

  -- Base score by legal status
  v_base_score := CASE v_status
    WHEN 'Titled' THEN 80.0
    WHEN 'In-Process' THEN 50.0
    WHEN 'Melkia' THEN 20.0
  END;

  -- Add points for verified documents (max +20)
  RETURN LEAST(100, v_base_score + (v_doc_count * 4));
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_scouts ENABLE ROW LEVEL SECURITY;

-- Policies (to be customized based on auth requirements)
CREATE POLICY "Enable read access for authenticated users" ON properties
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON properties
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON properties
  FOR UPDATE TO authenticated USING (true);
