-- The Damn Penguin: Regional Data & Confidence Breakdown
-- Migration 002: National Investment Pipeline

-- =============================================================================
-- REGIONAL CLASSIFICATION
-- =============================================================================

CREATE TYPE investment_region AS ENUM (
  'Marrakech-Safi',      -- Primary: Marrakech, Essaouira
  'Fes-Meknes',          -- Secondary: Fes, Meknes
  'Casablanca-Settat',   -- Primary: Casablanca
  'Rabat-Sale-Kenitra',  -- Primary: Rabat
  'Tanger-Tetouan',      -- Primary: Tangier
  'Souss-Massa',         -- Secondary: Agadir
  'Draa-Tafilalet',      -- Emerging: Ouarzazate
  'Other'
);

CREATE TYPE city_classification AS ENUM (
  'Marrakech',
  'Essaouira',
  'Fes',
  'Casablanca',
  'Rabat',
  'Tangier',
  'Agadir',
  'Ouarzazate',
  'Meknes',
  'Other'
);

-- =============================================================================
-- CONFIDENCE BREAKDOWN — Audit Factors
-- =============================================================================

CREATE TYPE verification_status AS ENUM (
  'OK',
  'PENDING',
  'FAILED',
  'NOT_APPLICABLE'
);

-- =============================================================================
-- ADD COLUMNS TO PROPERTIES
-- =============================================================================

-- Regional classification
ALTER TABLE properties ADD COLUMN IF NOT EXISTS region investment_region;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS city city_classification;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS street_address TEXT;

-- Confidence breakdown factors
ALTER TABLE properties ADD COLUMN IF NOT EXISTS cadastre_status verification_status DEFAULT 'PENDING';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS heirs_status verification_status DEFAULT 'PENDING';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS encumbrance_status verification_status DEFAULT 'PENDING';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS occupation_status verification_status DEFAULT 'PENDING';

-- Net acquisition cost (after charter cashback)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS net_acquisition_cost_mad NUMERIC(15,2);

-- Property type classification
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_type VARCHAR(50);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS construction_year INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rooms INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS floors INTEGER;

-- =============================================================================
-- INDEXES FOR REGIONAL QUERIES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_properties_region ON properties (region);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties (city);
CREATE INDEX IF NOT EXISTS idx_properties_region_city ON properties (region, city);

-- =============================================================================
-- FUNCTION: Calculate Net Acquisition Cost
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_net_acquisition_cost(
  p_acquisition_price NUMERIC,
  p_cashback_pct NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
  IF p_acquisition_price IS NULL OR p_cashback_pct IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN p_acquisition_price * (1 - p_cashback_pct / 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- TRIGGER: Auto-calculate net acquisition cost
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_calculate_net_cost()
RETURNS TRIGGER AS $$
BEGIN
  NEW.net_acquisition_cost_mad := calculate_net_acquisition_cost(
    NEW.acquisition_price_mad,
    NEW.estimated_cashback_pct
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_properties_net_cost ON properties;
CREATE TRIGGER trigger_properties_net_cost
  BEFORE INSERT OR UPDATE OF acquisition_price_mad, estimated_cashback_pct
  ON properties
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_net_cost();

-- =============================================================================
-- LAND PARCELS TABLE (for Mapbox visualization)
-- =============================================================================

CREATE TABLE IF NOT EXISTS land_parcels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  polygon geography(POLYGON, 4326) NOT NULL,
  legal_status legal_status NOT NULL DEFAULT 'Melkia',
  
  title_number VARCHAR(50),
  estimated_value_mad NUMERIC(15,2),
  
  -- Regional data
  region investment_region,
  city city_classification,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime for land_parcels (for Supabase Realtime integration)
ALTER PUBLICATION supabase_realtime ADD TABLE land_parcels;

-- Geospatial index
CREATE INDEX IF NOT EXISTS idx_land_parcels_polygon ON land_parcels USING GIST (polygon);
CREATE INDEX IF NOT EXISTS idx_land_parcels_region ON land_parcels (region);
CREATE INDEX IF NOT EXISTS idx_land_parcels_city ON land_parcels (city);

-- RLS
ALTER TABLE land_parcels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for land_parcels" ON land_parcels
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for land_parcels" ON land_parcels
  FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================================================
-- VIEW: Regional Portfolio Summary
-- =============================================================================

CREATE OR REPLACE VIEW regional_portfolio_summary AS
SELECT
  region,
  city,
  COUNT(*) as property_count,
  SUM(estimated_value_mad) as total_value_mad,
  AVG(legal_confidence_score) as avg_confidence,
  SUM(CASE WHEN legal_status = 'Titled' THEN 1 ELSE 0 END) as titled_count,
  SUM(CASE WHEN legal_status = 'In-Process' THEN 1 ELSE 0 END) as in_process_count,
  SUM(CASE WHEN legal_status = 'Melkia' THEN 1 ELSE 0 END) as melkia_count,
  SUM(net_acquisition_cost_mad) as total_net_cost_mad,
  SUM(acquisition_price_mad - net_acquisition_cost_mad) as total_charter_savings_mad
FROM properties
WHERE region IS NOT NULL
GROUP BY region, city
ORDER BY region, city;

-- =============================================================================
-- SAMPLE DATA: Regional Properties
-- =============================================================================

-- Marrakech specimens
INSERT INTO properties (
  title_number, legal_status, legal_confidence_score,
  gps_point, cadastral_zone,
  region, city, neighborhood,
  charter_category, charter_eligible, estimated_cashback_pct,
  acquisition_price_mad, estimated_value_mad, surface_sqm, price_per_sqm_mad,
  cadastre_status, heirs_status, encumbrance_status, occupation_status
) VALUES 
(
  'TF-12847/M', 'Titled', 94,
  ST_SetSRID(ST_MakePoint(-7.9811, 31.6295), 4326)::geography,
  'MR-2847-014',
  'Marrakech-Safi', 'Marrakech', 'Médina',
  'A', true, 10,
  4200000, 5100000, 400, 12750,
  'OK', 'OK', 'OK', 'OK'
),
(
  'TF-8842/M', 'Titled', 88,
  ST_SetSRID(ST_MakePoint(-7.9932, 31.6412), 4326)::geography,
  'MR-8842-007',
  'Marrakech-Safi', 'Marrakech', 'Guéliz',
  'A', true, 10,
  6800000, 7500000, 520, 14423,
  'OK', 'OK', 'PENDING', 'OK'
);

-- Essaouira specimens
INSERT INTO properties (
  requisition_number, legal_status, legal_confidence_score,
  gps_point, cadastral_zone,
  region, city, neighborhood,
  charter_category, charter_eligible, estimated_cashback_pct,
  acquisition_price_mad, estimated_value_mad, surface_sqm, price_per_sqm_mad,
  cadastre_status, heirs_status, encumbrance_status, occupation_status
) VALUES 
(
  'REQ-2024-4521', 'In-Process', 67,
  ST_SetSRID(ST_MakePoint(-9.7668, 31.5085), 4326)::geography,
  'ES-1247-008',
  'Marrakech-Safi', 'Essaouira', 'Médina',
  'B', true, 15,
  2800000, 3200000, 350, 9142,
  'OK', 'PENDING', 'OK', 'OK'
);

-- Fes specimens
INSERT INTO properties (
  title_number, legal_status, legal_confidence_score,
  gps_point, cadastral_zone,
  region, city, neighborhood,
  charter_category, charter_eligible, estimated_cashback_pct,
  acquisition_price_mad, estimated_value_mad, surface_sqm, price_per_sqm_mad,
  cadastre_status, heirs_status, encumbrance_status, occupation_status
) VALUES 
(
  'TF-5521/F', 'Titled', 91,
  ST_SetSRID(ST_MakePoint(-5.0003, 34.0333), 4326)::geography,
  'FS-5521-012',
  'Fes-Meknes', 'Fes', 'Fes el-Bali',
  'B', true, 15,
  3200000, 3800000, 480, 7916,
  'OK', 'OK', 'OK', 'OK'
),
(
  NULL, 'Melkia', 38,
  ST_SetSRID(ST_MakePoint(-4.9887, 34.0456), 4326)::geography,
  'FS-8872-003',
  'Fes-Meknes', 'Fes', 'Fes el-Jedid',
  'B', false, NULL,
  1800000, 2100000, 320, 6562,
  'PENDING', 'PENDING', 'PENDING', 'PENDING'
);

-- Ouarzazate specimen (Emerging zone)
INSERT INTO properties (
  melkia_reference, legal_status, legal_confidence_score,
  gps_point, cadastral_zone,
  region, city, neighborhood,
  charter_category, charter_eligible, estimated_cashback_pct,
  acquisition_price_mad, estimated_value_mad, surface_sqm, price_per_sqm_mad,
  cadastre_status, heirs_status, encumbrance_status, occupation_status
) VALUES 
(
  'MLK-OZ-7842', 'Melkia', 34,
  ST_SetSRID(ST_MakePoint(-6.8936, 30.9189), 4326)::geography,
  'OZ-7842-021',
  'Draa-Tafilalet', 'Ouarzazate', 'Kasbah Taourirt',
  'C', true, 20,
  1200000, 1400000, 350, 4000,
  'PENDING', 'PENDING', 'FAILED', 'OK'
);
