'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { LegalStamp, LegalStampCompact } from '@/components/verification-badge';
import { CinematicMap, type LandParcel } from '@/components/cinematic-map';
import type {
  LegalStatus,
  CharterCategory,
  PortfolioSummary,
  Property,
} from '@/types';

// =============================================================================
// ANIMATION VARIANTS — Staggered Entrance (10-20px slide, no bounce)
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

// =============================================================================
// MOCK DATA — Replace with Supabase
// =============================================================================

const mockSummary: PortfolioSummary = {
  total_properties: 12,
  total_value_mad: 48500000,
  by_legal_status: {
    Titled: 5,
    'In-Process': 4,
    Melkia: 3,
  },
  by_charter_category: {
    A: 3,
    B: 6,
    C: 3,
  },
  average_legal_confidence: 76,
  total_potential_cashback_mad: 6420000,
};

const mockProperties: Property[] = [
  {
    id: '1',
    title_number: 'TF-12847/M',
    requisition_number: null,
    melkia_reference: null,
    legal_status: 'Titled',
    legal_confidence_score: 94,
    gps_point: { type: 'Point', coordinates: [-7.9811, 31.6295] },
    boundary_polygon: null,
    cadastral_zone: 'MR-2847-014',
    charter_category: 'A',
    charter_score: 82,
    charter_eligible: true,
    estimated_cashback_pct: 10,
    acquisition_price_mad: 4200000,
    estimated_value_mad: 5100000,
    price_per_sqm_mad: 12750,
    surface_sqm: 400,
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
    gps_point: { type: 'Point', coordinates: [-9.7668, 31.5085] },
    boundary_polygon: null,
    cadastral_zone: 'SM-1247-008',
    charter_category: 'B',
    charter_score: 71,
    charter_eligible: true,
    estimated_cashback_pct: 15,
    acquisition_price_mad: 2800000,
    estimated_value_mad: 3200000,
    price_per_sqm_mad: 8000,
    surface_sqm: 400,
    audit_trail: [],
    created_at: '2024-02-10T09:00:00Z',
    updated_at: '2024-02-15T11:20:00Z',
    created_by: null,
    updated_by: null,
  },
  {
    id: '3',
    title_number: null,
    requisition_number: null,
    melkia_reference: 'MLK-OZ-7842',
    legal_status: 'Melkia',
    legal_confidence_score: 34,
    gps_point: { type: 'Point', coordinates: [-6.8936, 30.9189] },
    boundary_polygon: null,
    cadastral_zone: 'DT-7842-021',
    charter_category: 'C',
    charter_score: 45,
    charter_eligible: false,
    estimated_cashback_pct: null,
    acquisition_price_mad: 1200000,
    estimated_value_mad: 1400000,
    price_per_sqm_mad: 4000,
    surface_sqm: 350,
    audit_trail: [],
    created_at: '2024-03-01T08:00:00Z',
    updated_at: '2024-03-05T16:45:00Z',
    created_by: null,
    updated_by: null,
  },
];

// Mock parcels for map visualization
const mockParcels: LandParcel[] = [
  {
    id: 'parcel-1',
    property_id: '1',
    polygon: {
      type: 'Polygon',
      coordinates: [[
        [-7.9815, 31.6300],
        [-7.9807, 31.6300],
        [-7.9807, 31.6290],
        [-7.9815, 31.6290],
        [-7.9815, 31.6300],
      ]],
    },
    legal_status: 'Titled',
    title_number: 'TF-12847/M',
    estimated_value_mad: 5100000,
  },
  {
    id: 'parcel-2',
    property_id: '2',
    polygon: {
      type: 'Polygon',
      coordinates: [[
        [-9.7672, 31.5090],
        [-9.7664, 31.5090],
        [-9.7664, 31.5080],
        [-9.7672, 31.5080],
        [-9.7672, 31.5090],
      ]],
    },
    legal_status: 'In-Process',
    estimated_value_mad: 3200000,
  },
  {
    id: 'parcel-3',
    property_id: '3',
    polygon: {
      type: 'Polygon',
      coordinates: [[
        [-6.8940, 30.9194],
        [-6.8932, 30.9194],
        [-6.8932, 30.9184],
        [-6.8940, 30.9184],
        [-6.8940, 30.9194],
      ]],
    },
    legal_status: 'Melkia',
    estimated_value_mad: 1400000,
  },
];

// =============================================================================
// UTILITY — Format MAD Currency
// =============================================================================

function formatMAD(value: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// =============================================================================
// COMPONENTS
// =============================================================================

function StatBlock({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
}) {
  return (
    <div className="stat-block">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {sublabel && <span className="stat-subtext">{sublabel}</span>}
    </div>
  );
}

function SpecimenCard({ property }: { property: Property }) {
  const identifier =
    property.title_number ||
    property.requisition_number ||
    property.melkia_reference ||
    'UNREGISTERED';

  const gps = property.gps_point
    ? `${property.gps_point.coordinates[1].toFixed(6)}°N, ${Math.abs(property.gps_point.coordinates[0]).toFixed(6)}°W`
    : 'NO GPS';

  return (
    <Link href={`/refinery/${property.id}`} className="block">
      <article className="specimen-card group">
        {/* Metadata Ribbon */}
        <div className="metadata-ribbon">
          <span>{identifier}</span>
          <span>{gps}</span>
        </div>

        {/* Specimen Image Placeholder */}
        <div className="aspect-[4/3] bg-[#F9F9F9] flex items-center justify-center">
          <span className="font-mono text-xs tracking-widest opacity-30">
            SPECIMEN {property.id}
          </span>
        </div>

        {/* Body */}
        <div className="specimen-body">
          <div className="flex items-start justify-between gap-4">
            <div>
              <LegalStamp
                status={property.legal_status}
                confidenceScore={property.legal_confidence_score}
                size="sm"
              />
            </div>
            <div className="text-right">
              <p className="font-mono text-xs uppercase tracking-wider opacity-50">
                Est. Value
              </p>
              <p className="font-serif text-xl">
                {property.estimated_value_mad
                  ? `${formatMAD(property.estimated_value_mad)} MAD`
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="specimen-footer flex items-center justify-between">
          <span className="font-mono text-xs tracking-wider opacity-50">
            {property.cadastral_zone || 'NO ZONE'}
          </span>
          {property.charter_category && (
            <span className="font-mono text-xs tracking-widest">
              CAT {property.charter_category}
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}

function SpecimenTable({ properties }: { properties: Property[] }) {
  if (properties.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-widest opacity-50">
          No specimens in collection
        </p>
        <Link href="/scout" className="btn-editorial mt-8 inline-block">
          Begin Scouting
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table-editorial">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Status</th>
            <th>Zone</th>
            <th>Category</th>
            <th className="text-right">Value (MAD)</th>
            <th className="text-right">Cashback</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((property) => {
            const identifier =
              property.title_number ||
              property.requisition_number ||
              property.melkia_reference ||
              '—';

            return (
              <tr key={property.id}>
                <td>
                  <Link
                    href={`/refinery/${property.id}`}
                    className="font-mono text-sm hover:underline"
                  >
                    {identifier}
                  </Link>
                </td>
                <td>
                  <LegalStampCompact status={property.legal_status} />
                </td>
                <td className="font-mono text-sm opacity-70">
                  {property.cadastral_zone || '—'}
                </td>
                <td className="font-mono text-sm">
                  {property.charter_category || '—'}
                </td>
                <td className="text-right font-mono text-sm tabular-nums">
                  {property.estimated_value_mad
                    ? formatMAD(property.estimated_value_mad)
                    : '—'}
                </td>
                <td className="text-right font-mono text-sm tabular-nums">
                  {property.estimated_cashback_pct
                    ? `${property.estimated_cashback_pct}%`
                    : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function DashboardPage() {
  const summary = mockSummary;
  const properties = mockProperties;

  return (
    <div className="min-h-screen bg-white safe-top safe-bottom">
      {/* Navigation */}
      <nav className="nav-editorial">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            The Damn Penguin
          </Link>
          <div className="nav-links">
            <Link href="/dashboard" className="nav-link nav-link--active">
              Portfolio
            </Link>
            <Link href="/scout" className="nav-link">
              Scout
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section — Massive White Space */}
      <motion.section
        className="whitespace-authority"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container-editorial">
          <motion.div variants={itemVariants}>
            <h3 className="mb-4">Morocco 2026 Investment Charter</h3>
          </motion.div>
          <motion.h1 variants={itemVariants} className="mb-8 max-w-3xl">
            Digital Investment Gallery
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="font-editorial max-w-xl text-lg opacity-70"
          >
            Curated property intelligence for institutional investors. Each specimen
            verified against the Bulletin Officiel and E-Cadastre records.
          </motion.p>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        className="section-alabaster"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        <div className="container-editorial">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <motion.div variants={itemVariants}>
              <StatBlock
                label="Specimens"
                value={summary.total_properties}
                sublabel="In collection"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatBlock
                label="Portfolio Value"
                value={`${(summary.total_value_mad / 1_000_000).toFixed(1)}M`}
                sublabel="MAD"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatBlock
                label="Avg. Confidence"
                value={`${summary.average_legal_confidence}%`}
                sublabel="Legal verification"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatBlock
                label="Charter Potential"
                value={`${(summary.total_potential_cashback_mad / 1_000_000).toFixed(1)}M`}
                sublabel="MAD cashback"
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Status Breakdown */}
      <motion.section
        className="section-void"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        <div className="container-editorial">
          <motion.div variants={itemVariants}>
            <h3 className="mb-8">By Legal Status</h3>
          </motion.div>
          <div className="grid grid-cols-3 gap-px bg-[#EEEEEE]">
            <motion.div
              variants={itemVariants}
              className="bg-white p-8 text-center"
            >
              <p className="font-serif text-5xl">{summary.by_legal_status.Titled}</p>
              <p className="mt-2 font-mono text-xs uppercase tracking-widest opacity-50">
                Certified
              </p>
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="bg-white p-8 text-center"
            >
              <p className="font-serif text-5xl">
                {summary.by_legal_status['In-Process']}
              </p>
              <p className="mt-2 font-mono text-xs uppercase tracking-widest opacity-50">
                Pending
              </p>
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="bg-white p-8 text-center"
            >
              <p className="font-serif text-5xl">{summary.by_legal_status.Melkia}</p>
              <p className="mt-2 font-mono text-xs uppercase tracking-widest opacity-50">
                Unverified
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Portfolio Map — Cinematic Globe View */}
      <motion.section
        className="section-alabaster"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        <div className="container-editorial">
          <motion.div variants={itemVariants} className="mb-8">
            <h3>Territorial Overview</h3>
          </motion.div>
          <motion.div variants={itemVariants}>
            <CinematicMap
              height="500px"
              showCrosshair={true}
              parcels={mockParcels}
              onParcelClick={(parcel) => {
                window.location.href = `/refinery/${parcel.property_id}`;
              }}
            />
          </motion.div>
        </div>
      </motion.section>

      {/* Specimen Grid */}
      <motion.section
        className="section-void"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        <div className="container-editorial">
          <motion.div
            variants={itemVariants}
            className="mb-8 flex items-end justify-between"
          >
            <h3>Specimen Catalog</h3>
            <Link href="/scout" className="btn-editorial">
              Add Specimen
            </Link>
          </motion.div>

          {/* Grid View */}
          <div className="grid gap-px bg-[#EEEEEE] md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <motion.div
                key={property.id}
                variants={itemVariants}
                className="bg-white"
              >
                <SpecimenCard property={property} />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Table View */}
      <motion.section
        className="section-alabaster"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        <div className="container-editorial">
          <motion.div variants={itemVariants}>
            <h3 className="mb-8">Full Index</h3>
          </motion.div>
          <motion.div variants={itemVariants}>
            <SpecimenTable properties={properties} />
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="section-void border-t border-[#EEEEEE]">
        <div className="container-editorial">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs uppercase tracking-widest opacity-50">
              © 2026 The Damn Penguin
            </p>
            <p className="font-mono text-xs uppercase tracking-widest opacity-50">
              Morocco Investment Charter
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
