'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LegalStamp } from '@/components/verification-badge';
import { CinematicMap, type CinematicMapHandle, type LandParcel } from '@/components/cinematic-map';
import type {
  LegalStatus,
  CityClassification,
  VerificationStatus,
  Property,
} from '@/types';

// =============================================================================
// ANIMATION VARIANTS — Staggered Entrance
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// =============================================================================
// REGIONAL FILTER OPTIONS
// =============================================================================

const REGIONS: { value: CityClassification | 'all'; label: string; italicLabel?: string }[] = [
  { value: 'all', label: 'ALL REGIONS' },
  { value: 'Marrakech', label: 'Marrakech' },
  { value: 'Fes', label: '', italicLabel: 'Fès' },
  { value: 'Essaouira', label: '', italicLabel: 'Essaouira' },
  { value: 'Ouarzazate', label: '', italicLabel: 'Ouarzazate' },
];

// =============================================================================
// MOCK DATA — Regional Properties
// =============================================================================

const mockProperties: Property[] = [
  {
    id: '1',
    title_number: 'TF-12847/M',
    requisition_number: null,
    melkia_reference: null,
    legal_status: 'Titled',
    legal_confidence_score: 94,
    cadastre_status: 'OK',
    heirs_status: 'OK',
    encumbrance_status: 'OK',
    occupation_status: 'OK',
    gps_point: { type: 'Point', coordinates: [-7.9811, 31.6295] },
    boundary_polygon: null,
    cadastral_zone: 'MR-2847-014',
    region: 'Marrakech-Safi',
    city: 'Marrakech',
    neighborhood: 'Médina',
    street_address: null,
    charter_category: 'A',
    charter_score: 82,
    charter_eligible: true,
    estimated_cashback_pct: 10,
    acquisition_price_mad: 5100000,
    estimated_value_mad: 5100000,
    price_per_sqm_mad: 12750,
    surface_sqm: 400,
    net_acquisition_cost_mad: 4590000,
    property_type: 'Riad',
    construction_year: 1890,
    rooms: 7,
    floors: 2,
    audit_trail: [],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T14:30:00Z',
    created_by: null,
    updated_by: null,
  },
  {
    id: '2',
    title_number: null,
    requisition_number: 'REQ-2024-4521',
    melkia_reference: null,
    legal_status: 'In-Process',
    legal_confidence_score: 67,
    cadastre_status: 'OK',
    heirs_status: 'PENDING',
    encumbrance_status: 'OK',
    occupation_status: 'OK',
    gps_point: { type: 'Point', coordinates: [-9.7668, 31.5085] },
    boundary_polygon: null,
    cadastral_zone: 'ES-1247-008',
    region: 'Marrakech-Safi',
    city: 'Essaouira',
    neighborhood: 'Médina',
    street_address: null,
    charter_category: 'B',
    charter_score: 71,
    charter_eligible: true,
    estimated_cashback_pct: 15,
    acquisition_price_mad: 3200000,
    estimated_value_mad: 3200000,
    price_per_sqm_mad: 9142,
    surface_sqm: 350,
    net_acquisition_cost_mad: 2720000,
    property_type: 'Dar',
    construction_year: 1920,
    rooms: 5,
    floors: 2,
    audit_trail: [],
    created_at: '2024-02-10T09:00:00Z',
    updated_at: '2024-02-15T11:20:00Z',
    created_by: null,
    updated_by: null,
  },
  {
    id: '3',
    title_number: 'TF-5521/F',
    requisition_number: null,
    melkia_reference: null,
    legal_status: 'Titled',
    legal_confidence_score: 91,
    cadastre_status: 'OK',
    heirs_status: 'OK',
    encumbrance_status: 'OK',
    occupation_status: 'OK',
    gps_point: { type: 'Point', coordinates: [-5.0003, 34.0333] },
    boundary_polygon: null,
    cadastral_zone: 'FS-5521-012',
    region: 'Fes-Meknes',
    city: 'Fes',
    neighborhood: 'Fes el-Bali',
    street_address: null,
    charter_category: 'B',
    charter_score: 78,
    charter_eligible: true,
    estimated_cashback_pct: 15,
    acquisition_price_mad: 3800000,
    estimated_value_mad: 3800000,
    price_per_sqm_mad: 7916,
    surface_sqm: 480,
    net_acquisition_cost_mad: 3230000,
    property_type: 'Riad',
    construction_year: 1850,
    rooms: 9,
    floors: 2,
    audit_trail: [],
    created_at: '2024-03-01T08:00:00Z',
    updated_at: '2024-03-05T16:45:00Z',
    created_by: null,
    updated_by: null,
  },
  {
    id: '4',
    title_number: null,
    requisition_number: null,
    melkia_reference: 'MLK-OZ-7842',
    legal_status: 'Melkia',
    legal_confidence_score: 34,
    cadastre_status: 'PENDING',
    heirs_status: 'PENDING',
    encumbrance_status: 'FAILED',
    occupation_status: 'OK',
    gps_point: { type: 'Point', coordinates: [-6.8936, 30.9189] },
    boundary_polygon: null,
    cadastral_zone: 'OZ-7842-021',
    region: 'Draa-Tafilalet',
    city: 'Ouarzazate',
    neighborhood: 'Kasbah Taourirt',
    street_address: null,
    charter_category: 'C',
    charter_score: 45,
    charter_eligible: true,
    estimated_cashback_pct: 20,
    acquisition_price_mad: 1400000,
    estimated_value_mad: 1400000,
    price_per_sqm_mad: 4000,
    surface_sqm: 350,
    net_acquisition_cost_mad: 1120000,
    property_type: 'Kasbah',
    construction_year: 1780,
    rooms: 12,
    floors: 3,
    audit_trail: [],
    created_at: '2024-03-10T08:00:00Z',
    updated_at: '2024-03-15T16:45:00Z',
    created_by: null,
    updated_by: null,
  },
];

// Convert properties to map parcels
const mockParcels: LandParcel[] = mockProperties.map((p) => ({
  id: `parcel-${p.id}`,
  property_id: p.id,
  polygon: {
    type: 'Polygon' as const,
    coordinates: p.gps_point
      ? [[
          [p.gps_point.coordinates[0] - 0.0004, p.gps_point.coordinates[1] + 0.0005],
          [p.gps_point.coordinates[0] + 0.0004, p.gps_point.coordinates[1] + 0.0005],
          [p.gps_point.coordinates[0] + 0.0004, p.gps_point.coordinates[1] - 0.0005],
          [p.gps_point.coordinates[0] - 0.0004, p.gps_point.coordinates[1] - 0.0005],
          [p.gps_point.coordinates[0] - 0.0004, p.gps_point.coordinates[1] + 0.0005],
        ]]
      : [[[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]],
  },
  legal_status: p.legal_status,
  title_number: p.title_number ?? undefined,
  estimated_value_mad: p.estimated_value_mad ?? undefined,
}));

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function formatMAD(value: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatConfidenceBreakdown(property: Property): string {
  const items: string[] = [];
  if (property.cadastre_status) items.push(`CADASTRE: ${property.cadastre_status}`);
  if (property.heirs_status) items.push(`HEIRS: ${property.heirs_status}`);
  return items.join(' | ');
}

// =============================================================================
// COMPONENTS
// =============================================================================

function RegionalToggle({
  value,
  onChange,
}: {
  value: CityClassification | 'all';
  onChange: (value: CityClassification | 'all') => void;
}) {
  return (
    <div className="flex items-center gap-1 border-b border-[#EEEEEE]">
      {REGIONS.map((region) => (
        <button
          key={region.value}
          onClick={() => onChange(region.value)}
          className={`
            px-4 py-3 font-mono text-[10px] uppercase tracking-widest
            transition-all
            ${value === region.value
              ? 'border-b-2 border-black text-black'
              : 'text-black/40 hover:text-black/70'
            }
          `}
        >
          {region.italicLabel ? (
            <em className="font-serif text-xs not-italic">{region.italicLabel}</em>
          ) : (
            region.label
          )}
        </button>
      ))}
    </div>
  );
}

function BankStatementHeader({
  portfolioValue,
  charterPotential,
  totalNetCost,
}: {
  portfolioValue: number;
  charterPotential: number;
  totalNetCost: number;
}) {
  return (
    <div className="flex items-center border-b border-black">
      <div className="flex-1 border-r border-[#EEEEEE] px-6 py-4">
        <p className="font-mono text-[10px] uppercase tracking-widest opacity-40">
          Portfolio Value
        </p>
        <p className="font-mono text-2xl tracking-tighter">
          {formatMAD(portfolioValue)}
          <span className="ml-1 text-xs opacity-40">MAD</span>
        </p>
      </div>
      <div className="flex-1 border-r border-[#EEEEEE] px-6 py-4">
        <p className="font-mono text-[10px] uppercase tracking-widest opacity-40">
          Charter Potential
        </p>
        <p className="font-mono text-2xl tracking-tighter">
          {formatMAD(charterPotential)}
          <span className="ml-1 text-xs opacity-40">MAD</span>
        </p>
      </div>
      <div className="flex-1 px-6 py-4">
        <p className="font-mono text-[10px] uppercase tracking-widest opacity-40">
          Net Acquisition
        </p>
        <p className="font-mono text-2xl tracking-tighter">
          {formatMAD(totalNetCost)}
          <span className="ml-1 text-xs opacity-40">MAD</span>
        </p>
      </div>
    </div>
  );
}

function SpecimenCard({
  property,
  onHover,
  onLeave,
}: {
  property: Property;
  onHover: () => void;
  onLeave: () => void;
}) {
  const identifier =
    property.title_number ||
    property.requisition_number ||
    property.melkia_reference ||
    'UNREGISTERED';

  const gps = property.gps_point
    ? `${property.gps_point.coordinates[1].toFixed(6)}°N`
    : '—';

  return (
    <Link href={`/refinery/${property.id}`}>
      <article
        className="group border-b border-[#EEEEEE] transition-colors hover:bg-[#FAFAFA]"
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
      >
        {/* Technical Label Row */}
        <div className="flex items-center justify-between px-6 py-3">
          <span className="font-mono text-[10px] tracking-widest">
            {identifier}
          </span>
          <LegalStamp status={property.legal_status} size="sm" />
        </div>

        {/* Image — Full width, no padding, natural aspect */}
        <div className="aspect-[16/10] bg-[#F5F5F5]">
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-mono text-xs tracking-widest opacity-20">
              {property.property_type?.toUpperCase() || 'SPECIMEN'} — {property.city}
            </span>
          </div>
        </div>

        {/* Data Block */}
        <div className="px-6 py-4">
          {/* Region & City */}
          <p className="font-serif text-lg">
            <em>{property.city}</em>
            <span className="mx-2 opacity-20">·</span>
            <span className="font-mono text-xs tracking-wider opacity-50">
              {property.neighborhood}
            </span>
          </p>

          {/* Technical Data Row */}
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="font-mono text-[10px] tracking-widest opacity-40">
                {gps}
              </p>
              <p className="font-mono text-[10px] tracking-widest opacity-40">
                {property.cadastral_zone}
              </p>
            </div>

            {/* Net Acquisition Cost */}
            {property.acquisition_price_mad && property.net_acquisition_cost_mad && (
              <div className="text-right">
                <p className="font-mono text-xs tracking-tighter line-through opacity-30">
                  {formatMAD(property.acquisition_price_mad)} MAD
                </p>
                <p className="font-mono text-sm tracking-tighter">
                  {formatMAD(property.net_acquisition_cost_mad)} MAD
                  <span className="ml-1 text-[10px] opacity-50">(NET)</span>
                </p>
              </div>
            )}
          </div>

          {/* Audit Footnote */}
          <p className="mt-3 font-mono text-[9px] tracking-wider opacity-40">
            [{formatConfidenceBreakdown(property)}]
          </p>
        </div>
      </article>
    </Link>
  );
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function DashboardPage() {
  const mapRef = useRef<CinematicMapHandle>(null);
  const [regionFilter, setRegionFilter] = useState<CityClassification | 'all'>('all');
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);

  // Filter properties by region
  const filteredProperties = regionFilter === 'all'
    ? mockProperties
    : mockProperties.filter((p) => p.city === regionFilter);

  const filteredParcels = regionFilter === 'all'
    ? mockParcels
    : mockParcels.filter((p) => {
        const property = mockProperties.find((prop) => prop.id === p.property_id);
        return property?.city === regionFilter;
      });

  // Calculate portfolio stats
  const portfolioValue = filteredProperties.reduce(
    (sum, p) => sum + (p.estimated_value_mad || 0),
    0
  );
  const charterPotential = filteredProperties.reduce(
    (sum, p) => {
      if (p.acquisition_price_mad && p.estimated_cashback_pct) {
        return sum + (p.acquisition_price_mad * p.estimated_cashback_pct / 100);
      }
      return sum;
    },
    0
  );
  const totalNetCost = filteredProperties.reduce(
    (sum, p) => sum + (p.net_acquisition_cost_mad || 0),
    0
  );

  // Fly to property on hover
  const handlePropertyHover = useCallback((property: Property) => {
    setHoveredPropertyId(property.id);
    if (property.gps_point && mapRef.current) {
      mapRef.current.flyToProperty({
        lng: property.gps_point.coordinates[0],
        lat: property.gps_point.coordinates[1],
      }, 15);
    }
  }, []);

  const handlePropertyLeave = useCallback(() => {
    setHoveredPropertyId(null);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[#EEEEEE] bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/" className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em]">
            The Damn Penguin
          </Link>
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="font-mono text-[10px] uppercase tracking-widest">
              Portfolio
            </Link>
            <Link href="/scout" className="font-mono text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100">
              Scout
            </Link>
            <button
              onClick={async () => {
                await fetch('/api/auth', { method: 'DELETE' });
                window.location.href = '/login';
              }}
              className="font-mono text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100"
            >
              Exit
            </button>
          </div>
        </div>
      </nav>

      {/* Masthead — Heritage Newspaper Style */}
      <header className="border-b border-black px-6 py-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-40">
          Morocco 2026 Investment Charter
        </p>
        <h1 className="mt-2 font-serif text-4xl font-light tracking-tight">
          Digital Investment Gallery
        </h1>
        <p className="mt-1 font-serif text-lg italic opacity-60">
          National Property Intelligence Pipeline
        </p>
      </header>

      {/* Bank Statement Stats */}
      <BankStatementHeader
        portfolioValue={portfolioValue}
        charterPotential={charterPotential}
        totalNetCost={totalNetCost}
      />

      {/* Regional Toggle */}
      <RegionalToggle value={regionFilter} onChange={setRegionFilter} />

      {/* Split Screen: Map (Left) + Catalog (Right) */}
      <div className="flex flex-1">
        {/* Map — Sticky Left Panel */}
        <div className="sticky top-[120px] hidden h-[calc(100vh-120px)] w-1/2 border-r border-[#EEEEEE] lg:block">
          <CinematicMap
            ref={mapRef}
            height="100%"
            showCrosshair={true}
            parcels={filteredParcels}
            enableRealtime={false}
            onParcelClick={(parcel) => {
              window.location.href = `/refinery/${parcel.property_id}`;
            }}
          />
        </div>

        {/* Catalog — Scrolling Right Panel */}
        <div className="flex-1">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Specimen Count */}
            <div className="border-b border-[#EEEEEE] px-6 py-4">
              <p className="font-mono text-[10px] uppercase tracking-widest opacity-40">
                {filteredProperties.length} Specimens
                {regionFilter !== 'all' && (
                  <span className="ml-2">
                    · <em className="font-serif not-italic">{regionFilter}</em>
                  </span>
                )}
              </p>
            </div>

            {/* Specimen List */}
            {filteredProperties.length === 0 ? (
              <div className="flex h-64 items-center justify-center">
                <p className="font-mono text-xs uppercase tracking-widest opacity-30">
                  No specimens in this region
                </p>
              </div>
            ) : (
              filteredProperties.map((property) => (
                <motion.div key={property.id} variants={itemVariants}>
                  <SpecimenCard
                    property={property}
                    onHover={() => handlePropertyHover(property)}
                    onLeave={handlePropertyLeave}
                  />
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-black px-6 py-6">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-widest opacity-40">
            © 2026 The Damn Penguin
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest opacity-40">
            Institutional Access Only
          </p>
        </div>
      </footer>
    </div>
  );
}
