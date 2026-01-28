import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  VerificationBadge,
  LegalConfidenceMeter,
} from '@/components/verification-badge';
import {
  calculateCharterIncentives,
  formatMAD,
} from '@/lib/utils/charter-calculator';
import type { Property, PropertyDocument, AuditEvent } from '@/types';

// =============================================================================
// METADATA
// =============================================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  // TODO: Fetch property title
  return {
    title: `Property ${id.slice(0, 8)}`,
    description: 'Detailed property audit view',
  };
}

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getProperty(id: string): Promise<Property | null> {
  // TODO: Replace with Supabase query
  // Placeholder - return null triggers notFound()
  return null;
}

async function getPropertyDocuments(
  propertyId: string
): Promise<PropertyDocument[]> {
  // TODO: Replace with Supabase query
  return [];
}

// =============================================================================
// COMPONENTS
// =============================================================================

function PropertyHeader({ property }: { property: Property }) {
  const identifier =
    property.title_number ||
    property.requisition_number ||
    property.melkia_reference ||
    'Unregistered Property';

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-2 inline-flex text-sm text-slate-500 hover:text-slate-700"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-semibold text-slate-900">
              {identifier}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <VerificationBadge
                status={property.legal_status}
                confidenceScore={property.legal_confidence_score}
              />
              {property.charter_category && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                  Category {property.charter_category}
                </span>
              )}
              {property.cadastral_zone && (
                <span className="text-sm text-slate-500">
                  Zone: {property.cadastral_zone}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-md">Export PDF</button>
            <button className="btn btn-primary btn-md">Edit Property</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LegalStatusCard({ property }: { property: Property }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="font-semibold text-slate-900">Legal Status</h2>
      </div>
      <div className="card-body space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Current Status</span>
          <VerificationBadge status={property.legal_status} />
        </div>

        {property.legal_confidence_score !== null && (
          <LegalConfidenceMeter
            score={property.legal_confidence_score}
            status={property.legal_status}
          />
        )}

        <div className="space-y-2 border-t border-slate-100 pt-4">
          {property.title_number && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Title Number</span>
              <span className="mono-data">{property.title_number}</span>
            </div>
          )}
          {property.requisition_number && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Requisition</span>
              <span className="mono-data">{property.requisition_number}</span>
            </div>
          )}
          {property.melkia_reference && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Melkia Ref</span>
              <span className="mono-data">{property.melkia_reference}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CharterAssessmentCard({ property }: { property: Property }) {
  if (!property.charter_category || !property.acquisition_price_mad) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-slate-900">2026 Charter Assessment</h2>
        </div>
        <div className="card-body text-center text-slate-500">
          <p>Insufficient data for charter calculation</p>
          <p className="mt-1 text-sm">
            Add acquisition price and category to enable
          </p>
        </div>
      </div>
    );
  }

  const result = calculateCharterIncentives({
    acquisition_price_mad: property.acquisition_price_mad,
    charter_category: property.charter_category,
    is_renovation: false,
  });

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">2026 Charter Assessment</h2>
        <span
          className={`
            rounded-full px-2 py-0.5 text-xs font-medium
            ${
              property.charter_eligible
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-600'
            }
          `}
        >
          {property.charter_eligible ? 'Eligible' : 'Not Eligible'}
        </span>
      </div>
      <div className="card-body">
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Base Rate
            </p>
            <p className="text-2xl font-semibold text-slate-900">
              {result.base_cashback_pct}%
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Total Cashback
            </p>
            <p className="text-2xl font-semibold text-emerald-600">
              {result.total_cashback_pct}%
            </p>
          </div>
        </div>

        <div className="space-y-2 border-t border-slate-100 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Eligible Investment</span>
            <span className="mono-data">
              {formatMAD(result.eligible_investment_mad)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Estimated Cashback</span>
            <span className="mono-data font-semibold text-emerald-600">
              {formatMAD(result.estimated_cashback_mad)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Reference</span>
            <span className="text-xs text-slate-400">
              {result.decree_reference}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ValuationCard({ property }: { property: Property }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="font-semibold text-slate-900">Valuation</h2>
      </div>
      <div className="card-body">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-500">Acquisition Price</span>
            <span className="mono-data">
              {property.acquisition_price_mad
                ? formatMAD(property.acquisition_price_mad)
                : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Estimated Value</span>
            <span className="mono-data">
              {property.estimated_value_mad
                ? formatMAD(property.estimated_value_mad)
                : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Surface</span>
            <span className="mono-data">
              {property.surface_sqm ? `${property.surface_sqm} m²` : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Price/m²</span>
            <span className="mono-data">
              {property.price_per_sqm_mad
                ? `${formatMAD(property.price_per_sqm_mad)}/m²`
                : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function GeospatialCard({ property }: { property: Property }) {
  const hasLocation = property.gps_point !== null;
  const hasPolygon = property.boundary_polygon !== null;

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="font-semibold text-slate-900">Geospatial Data</h2>
      </div>
      <div className="card-body">
        {/* Map placeholder */}
        <div className="mb-4 flex aspect-video items-center justify-center rounded-lg bg-slate-100">
          {hasLocation ? (
            <span className="text-slate-500">
              Map view: {property.gps_point?.coordinates[1].toFixed(6)},{' '}
              {property.gps_point?.coordinates[0].toFixed(6)}
            </span>
          ) : (
            <span className="text-slate-400">No GPS data</span>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">GPS Point</span>
            <span
              className={`status-dot ${hasLocation ? 'bg-emerald-500' : 'bg-slate-300'}`}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Boundary Polygon</span>
            <span
              className={`status-dot ${hasPolygon ? 'bg-emerald-500' : 'bg-slate-300'}`}
            />
          </div>
          {property.cadastral_zone && (
            <div className="flex justify-between">
              <span className="text-slate-500">Cadastral Zone</span>
              <span className="mono-data">{property.cadastral_zone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AuditTrailCard({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-slate-900">Audit Trail</h2>
        </div>
        <div className="card-body text-center text-slate-500">
          No audit events recorded
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="font-semibold text-slate-900">Audit Trail</h2>
      </div>
      <div className="card-body">
        <div className="space-y-4">
          {events.map((event, index) => (
            <div
              key={index}
              className="relative border-l-2 border-slate-200 pl-4"
            >
              <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-slate-300" />
              <p className="text-xs text-slate-400">
                {new Date(event.timestamp).toLocaleString()}
              </p>
              <p className="font-medium text-slate-700">{event.event_type}</p>
              {event.data.source && (
                <p className="text-sm text-slate-500">
                  Source: {event.data.source}
                </p>
              )}
              {event.data.decree_number && (
                <p className="mono-data text-xs text-slate-400">
                  {event.data.decree_number}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentsCard({ documents }: { documents: PropertyDocument[] }) {
  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Documents</h2>
        <button className="btn btn-secondary btn-sm">Upload</button>
      </div>
      <div className="card-body">
        {documents.length === 0 ? (
          <p className="text-center text-slate-500">No documents uploaded</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
              >
                <div>
                  <p className="font-medium text-slate-700">
                    {doc.document_type}
                  </p>
                  {doc.source_reference && (
                    <p className="text-xs text-slate-500">
                      {doc.source_reference}
                    </p>
                  )}
                </div>
                <span
                  className={`
                    rounded-full px-2 py-0.5 text-xs font-medium
                    ${
                      doc.verification_status === 'verified'
                        ? 'bg-emerald-100 text-emerald-700'
                        : doc.verification_status === 'rejected'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-100 text-slate-600'
                    }
                  `}
                >
                  {doc.verification_status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function RefineryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [property, documents] = await Promise.all([
    getProperty(id),
    getPropertyDocuments(id),
  ]);

  if (!property) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PropertyHeader property={property} />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            <LegalStatusCard property={property} />
            <CharterAssessmentCard property={property} />
            <ValuationCard property={property} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <GeospatialCard property={property} />
            <DocumentsCard documents={documents} />
            <AuditTrailCard events={property.audit_trail} />
          </div>
        </div>
      </div>
    </div>
  );
}
