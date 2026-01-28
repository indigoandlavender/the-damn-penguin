'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  VerificationBlock,
  ConfidenceMeter,
} from '@/components/verification-badge';
import { StaticPropertyMap } from '@/components/cinematic-map';
import type { Property, AuditEvent, PropertyDocument } from '@/types';

// =============================================================================
// ANIMATION VARIANTS
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

const mockProperty: Property = {
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
  audit_trail: [
    {
      timestamp: '2024-01-15T10:00:00Z',
      event_type: 'creation',
      user_id: null,
      data: { source: 'Field Scout', notes: 'Initial property registration' },
    },
    {
      timestamp: '2024-01-18T14:30:00Z',
      event_type: 'document_upload',
      user_id: null,
      data: { source: 'Conservation Foncière', decree_number: 'BO-2024-7142' },
    },
    {
      timestamp: '2024-01-20T09:15:00Z',
      event_type: 'cadastral_match',
      user_id: null,
      data: { source: 'E-Cadastre', reference_url: 'https://ecadastre.ancfcc.gov.ma' },
    },
    {
      timestamp: '2024-01-22T11:45:00Z',
      event_type: 'legal_status_change',
      user_id: null,
      data: {
        source: 'Manual Verification',
        previous_value: 'In-Process',
        new_value: 'Titled',
      },
    },
  ],
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-22T11:45:00Z',
  created_by: null,
  updated_by: null,
};

const mockDocuments: PropertyDocument[] = [
  {
    id: 'd1',
    property_id: '1',
    document_type: 'Titre Foncier Certificate',
    file_path: '/docs/tf-12847-m.pdf',
    file_hash: 'a3f2b1c8d9e0',
    source_reference: 'Conservation Foncière Marrakech',
    verification_status: 'verified',
    captured_at: '2024-01-18T14:30:00Z',
    captured_gps: null,
    metadata: {},
    created_at: '2024-01-18T14:30:00Z',
  },
  {
    id: 'd2',
    property_id: '1',
    document_type: 'E-Cadastre Screenshot',
    file_path: '/docs/cadastre-mr-2847-014.png',
    file_hash: 'b4g3c2d1e0f9',
    source_reference: 'ANCFCC E-Cadastre Portal',
    verification_status: 'verified',
    captured_at: '2024-01-20T09:15:00Z',
    captured_gps: { type: 'Point', coordinates: [-7.9811, 31.6295] },
    metadata: {},
    created_at: '2024-01-20T09:15:00Z',
  },
];

const mockSources = [
  {
    index: 1,
    label: 'Bulletin Officiel',
    reference: 'BO n° 7142 du 18 janvier 2024',
    url: 'https://www.sgg.gov.ma/BO/bulletin_officiel.aspx',
  },
  {
    index: 2,
    label: 'E-Cadastre',
    reference: 'Parcelle MR-2847-014',
    url: 'https://ecadastre.ancfcc.gov.ma',
  },
  {
    index: 3,
    label: 'Loi-cadre n° 03-22',
    reference: 'Charte d\'Investissement 2026',
    url: 'https://www.sgg.gov.ma/loi-cadre-03-22',
  },
];

// =============================================================================
// UTILITY
// =============================================================================

function formatMAD(value: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// =============================================================================
// COMPONENTS
// =============================================================================

function PropertyMap({ property }: { property: Property }) {
  const hasLocation = property.gps_point !== null;
  
  if (!hasLocation) {
    return (
      <div className="relative aspect-video border border-black bg-[#F9F9F9]">
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-xs uppercase tracking-widest opacity-30">
            NO GPS DATA
          </span>
          <span className="mt-2 font-mono text-xs opacity-50">
            Acquire coordinates via Field Scout
          </span>
        </div>
      </div>
    );
  }

  return (
    <StaticPropertyMap
      center={{
        lng: property.gps_point!.coordinates[0],
        lat: property.gps_point!.coordinates[1],
      }}
      marker={property.gps_point}
      polygon={property.boundary_polygon}
      height="400px"
    />
  );
}

function ValuationBlock({ property }: { property: Property }) {
  return (
    <div className="specimen-card">
      <div className="specimen-header">
        <h3>Valuation</h3>
      </div>
      <div className="specimen-body">
        <div className="grid grid-cols-2 gap-6">
          <div className="stat-block">
            <span className="stat-label">Acquisition</span>
            <span className="stat-value--mono">
              {property.acquisition_price_mad
                ? formatMAD(property.acquisition_price_mad)
                : '—'}
            </span>
            <span className="stat-subtext">MAD</span>
          </div>
          <div className="stat-block">
            <span className="stat-label">Est. Value</span>
            <span className="stat-value--mono">
              {property.estimated_value_mad
                ? formatMAD(property.estimated_value_mad)
                : '—'}
            </span>
            <span className="stat-subtext">MAD</span>
          </div>
          <div className="stat-block">
            <span className="stat-label">Surface</span>
            <span className="stat-value--mono">
              {property.surface_sqm || '—'}
            </span>
            <span className="stat-subtext">m²</span>
          </div>
          <div className="stat-block">
            <span className="stat-label">Price/m²</span>
            <span className="stat-value--mono">
              {property.price_per_sqm_mad
                ? formatMAD(property.price_per_sqm_mad)
                : '—'}
            </span>
            <span className="stat-subtext">MAD</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CharterBlock({ property }: { property: Property }) {
  if (!property.charter_category) {
    return (
      <div className="specimen-card">
        <div className="specimen-header">
          <h3>2026 Charter Assessment</h3>
        </div>
        <div className="specimen-body py-12 text-center">
          <p className="font-mono text-xs uppercase tracking-widest opacity-50">
            Insufficient data for charter calculation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="specimen-card">
      <div className="specimen-header flex items-center justify-between">
        <h3>2026 Charter Assessment</h3>
        <span className="stamp stamp--certified text-[10px]">
          {property.charter_eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
        </span>
      </div>
      <div className="specimen-body">
        <div className="grid grid-cols-2 gap-6">
          <div className="stat-block">
            <span className="stat-label">Category</span>
            <span className="stat-value font-serif">{property.charter_category}</span>
            <span className="stat-subtext">Zone classification</span>
          </div>
          <div className="stat-block">
            <span className="stat-label">Cashback Rate</span>
            <span className="stat-value--mono">
              {property.estimated_cashback_pct || '—'}%
            </span>
            <span className="stat-subtext">Of eligible investment</span>
          </div>
        </div>

        {property.acquisition_price_mad && property.estimated_cashback_pct && (
          <div className="mt-6 border-t border-[#EEEEEE] pt-6">
            <div className="flex items-end justify-between">
              <div>
                <span className="stat-label">Potential Cashback</span>
              </div>
              <div className="text-right">
                <span className="font-serif text-3xl">
                  {formatMAD(
                    (property.acquisition_price_mad * property.estimated_cashback_pct) /
                      100
                  )}
                </span>
                <span className="ml-2 font-mono text-xs opacity-50">MAD</span>
              </div>
            </div>
            <p className="mt-2 font-mono text-xs opacity-50">
              Ref: Loi-cadre n° 03-22 — Charte d&apos;Investissement
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function AuditTimeline({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="specimen-card">
        <div className="specimen-header">
          <h3>Audit Trail</h3>
        </div>
        <div className="specimen-body py-12 text-center">
          <p className="font-mono text-xs uppercase tracking-widest opacity-50">
            No audit events recorded
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="specimen-card">
      <div className="specimen-header">
        <h3>Audit Trail</h3>
      </div>
      <div className="specimen-body">
        <div className="audit-timeline">
          {events.map((event, index) => (
            <div key={index} className="audit-event">
              <p className="audit-timestamp">{formatDate(event.timestamp)}</p>
              <p className="audit-type">
                {event.event_type.replace(/_/g, ' ')}
              </p>
              {event.data.source && (
                <p className="audit-detail">Source: {event.data.source}</p>
              )}
              {event.data.decree_number && (
                <p className="audit-detail">Ref: {event.data.decree_number}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentsBlock({ documents }: { documents: PropertyDocument[] }) {
  return (
    <div className="specimen-card">
      <div className="specimen-header flex items-center justify-between">
        <h3>Documents</h3>
        <button className="btn-editorial text-[10px]">Upload</button>
      </div>
      <div className="specimen-body">
        {documents.length === 0 ? (
          <p className="py-8 text-center font-mono text-xs uppercase tracking-widest opacity-50">
            No documents uploaded
          </p>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between border-b border-[#EEEEEE] pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-mono text-sm">{doc.document_type}</p>
                  <p className="mt-1 font-mono text-xs opacity-50">
                    {doc.source_reference}
                  </p>
                </div>
                <span
                  className={`stamp text-[10px] ${
                    doc.verification_status === 'verified'
                      ? 'stamp--certified'
                      : 'stamp--pending'
                  }`}
                >
                  {doc.verification_status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SourcesFootnotes({
  sources,
}: {
  sources: Array<{ index: number; label: string; reference: string; url: string }>;
}) {
  return (
    <div className="footnotes">
      <h3 className="footnotes-title">Sources</h3>
      <div className="space-y-1">
        {sources.map((source) => (
          <p key={source.index} className="footnote-item" data-index={`[${source.index}]`}>
            <strong>{source.label}</strong> — {source.reference}.{' '}
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="footnote-link"
            >
              View source ↗
            </a>
          </p>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function RefineryPage() {
  const params = useParams();
  const id = params.id as string;

  // In production, fetch from Supabase
  const property = mockProperty;
  const documents = mockDocuments;

  const identifier =
    property.title_number ||
    property.requisition_number ||
    property.melkia_reference ||
    'UNREGISTERED';

  return (
    <div className="min-h-screen bg-white safe-top safe-bottom">
      {/* Navigation */}
      <nav className="nav-editorial">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            The Damn Penguin
          </Link>
          <div className="nav-links">
            <Link href="/dashboard" className="nav-link">
              Portfolio
            </Link>
            <Link href="/scout" className="nav-link">
              Scout
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <motion.header
        className="border-b border-[#EEEEEE]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container-editorial py-8">
          <motion.div variants={itemVariants}>
            <Link
              href="/dashboard"
              className="font-mono text-xs uppercase tracking-widest opacity-50 hover:opacity-100"
            >
              ← Back to Portfolio
            </Link>
          </motion.div>
          <motion.div
            variants={itemVariants}
            className="mt-6 flex items-end justify-between"
          >
            <div>
              <h1 className="font-serif">{identifier}</h1>
              <p className="mt-2 font-mono text-sm uppercase tracking-wider opacity-50">
                Specimen {id} — {property.cadastral_zone || 'No Zone'}
              </p>
            </div>
            <div className="flex gap-4">
              <button className="btn-editorial">Export PDF</button>
              <button className="btn-editorial btn-editorial--filled">
                Edit
              </button>
            </div>
          </motion.div>
        </div>
      </motion.header>

      {/* Map Section — Cinematic 3D Terrain */}
      <motion.section
        className="section-void"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="container-editorial">
          <motion.div variants={itemVariants}>
            <PropertyMap property={property} />
          </motion.div>
        </div>
      </motion.section>

      {/* Main Content Grid */}
      <motion.section
        className="section-void"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        <div className="container-editorial">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-8">
              <motion.div variants={itemVariants}>
                <VerificationBlock
                  status={property.legal_status}
                  confidenceScore={property.legal_confidence_score}
                  titleNumber={property.title_number}
                  requisitionNumber={property.requisition_number}
                  melkiaReference={property.melkia_reference}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <CharterBlock property={property} />
              </motion.div>
              <motion.div variants={itemVariants}>
                <ValuationBlock property={property} />
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              <motion.div variants={itemVariants}>
                <DocumentsBlock documents={documents} />
              </motion.div>
              <motion.div variants={itemVariants}>
                <AuditTimeline events={property.audit_trail} />
              </motion.div>
            </div>
          </div>

          {/* Sources Section */}
          <motion.div variants={itemVariants}>
            <SourcesFootnotes sources={mockSources} />
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
              Last Updated: {formatDate(property.updated_at)}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
