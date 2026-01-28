import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { VerificationBadge } from '@/components/verification-badge';
import type {
  LegalStatus,
  CharterCategory,
  PortfolioSummary,
  Property,
  DashboardFilters,
} from '@/types';

// =============================================================================
// METADATA
// =============================================================================

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Portfolio overview with legal status filtering',
};

// =============================================================================
// TYPES
// =============================================================================

interface DashboardPageProps {
  searchParams: Promise<{
    status?: LegalStatus | LegalStatus[];
    category?: CharterCategory | CharterCategory[];
    q?: string;
  }>;
}

// =============================================================================
// DATA FETCHING (Placeholder - Connect to Supabase)
// =============================================================================

async function getPortfolioSummary(): Promise<PortfolioSummary> {
  // TODO: Replace with Supabase query
  return {
    total_properties: 0,
    total_value_mad: 0,
    by_legal_status: {
      Titled: 0,
      'In-Process': 0,
      Melkia: 0,
    },
    by_charter_category: {
      A: 0,
      B: 0,
      C: 0,
    },
    average_legal_confidence: 0,
    total_potential_cashback_mad: 0,
  };
}

async function getProperties(_filters: DashboardFilters): Promise<Property[]> {
  // TODO: Replace with Supabase query with PostGIS
  return [];
}

// =============================================================================
// COMPONENTS
// =============================================================================

function StatCard({
  label,
  value,
  subvalue,
  trend,
}: {
  label: string;
  value: string | number;
  subvalue?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="card">
      <div className="card-body">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
        {subvalue && (
          <p
            className={`mt-1 text-sm ${
              trend === 'up'
                ? 'text-emerald-600'
                : trend === 'down'
                  ? 'text-rose-600'
                  : 'text-slate-500'
            }`}
          >
            {subvalue}
          </p>
        )}
      </div>
    </div>
  );
}

function LegalStatusFilter({ activeStatuses }: { activeStatuses: LegalStatus[] }) {
  const statuses: LegalStatus[] = ['Titled', 'In-Process', 'Melkia'];

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => {
        const isActive = activeStatuses.includes(status);
        return (
          <Link
            key={status}
            href={`/dashboard?status=${status}`}
            className={`
              rounded-full px-4 py-2 text-sm font-medium transition-colors
              ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }
            `}
          >
            <VerificationBadge status={status} size="sm" showLabel />
          </Link>
        );
      })}
      <Link
        href="/dashboard"
        className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
      >
        Clear Filters
      </Link>
    </div>
  );
}

function PropertyRow({ property }: { property: Property }) {
  const identifier =
    property.title_number ||
    property.requisition_number ||
    property.melkia_reference ||
    'No Reference';

  return (
    <tr>
      <td>
        <Link
          href={`/refinery/${property.id}`}
          className="font-medium text-slate-900 hover:text-slate-700"
        >
          {identifier}
        </Link>
      </td>
      <td>
        <VerificationBadge
          status={property.legal_status}
          confidenceScore={property.legal_confidence_score}
          size="sm"
        />
      </td>
      <td className="mono-data">
        {property.charter_category || '—'}
      </td>
      <td className="mono-data">
        {property.estimated_cashback_pct
          ? `${property.estimated_cashback_pct}%`
          : '—'}
      </td>
      <td className="mono-data text-right">
        {property.estimated_value_mad
          ? new Intl.NumberFormat('fr-MA').format(property.estimated_value_mad)
          : '—'}
      </td>
      <td className="text-right">
        <Link
          href={`/refinery/${property.id}`}
          className="btn btn-secondary btn-sm"
        >
          View
        </Link>
      </td>
    </tr>
  );
}

function PropertiesTable({ properties }: { properties: Property[] }) {
  if (properties.length === 0) {
    return (
      <div className="card">
        <div className="card-body py-12 text-center">
          <p className="text-slate-500">No properties found</p>
          <Link href="/scout" className="btn btn-primary btn-md mt-4">
            Start Scouting
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Legal Status</th>
              <th>Category</th>
              <th>Cashback</th>
              <th className="text-right">Value (MAD)</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((property) => (
              <PropertyRow key={property.id} property={property} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card">
            <div className="card-body">
              <div className="h-3 w-20 rounded bg-slate-200" />
              <div className="mt-2 h-8 w-32 rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-body space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 rounded bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;

  // Parse filters from URL
  const statusFilter = params.status
    ? Array.isArray(params.status)
      ? params.status
      : [params.status]
    : [];

  const filters: DashboardFilters = {
    legal_status: statusFilter.length > 0 ? statusFilter : undefined,
    search: params.q,
  };

  // Fetch data
  const [summary, properties] = await Promise.all([
    getPortfolioSummary(),
    getProperties(filters),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 safe-top safe-bottom">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                Portfolio Dashboard
              </h1>
              <p className="text-sm text-slate-500">
                Morocco 2026 Investment Charter
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/scout" className="btn btn-secondary btn-md">
                Scout Mode
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Suspense fallback={<LoadingSkeleton />}>
          {/* Summary Stats */}
          <section className="mb-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Properties"
                value={summary.total_properties}
              />
              <StatCard
                label="Portfolio Value"
                value={`${(summary.total_value_mad / 1_000_000).toFixed(1)}M`}
                subvalue="MAD"
              />
              <StatCard
                label="Avg. Legal Confidence"
                value={`${summary.average_legal_confidence.toFixed(0)}%`}
              />
              <StatCard
                label="Potential Cashback"
                value={`${(summary.total_potential_cashback_mad / 1_000_000).toFixed(2)}M`}
                subvalue="MAD (2026 Charter)"
              />
            </div>
          </section>

          {/* Legal Status Breakdown */}
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
              By Legal Status
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="card legal-titled">
                <div className="card-body flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                    <span className="text-xl font-bold text-emerald-700">
                      {summary.by_legal_status.Titled}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Titled</p>
                    <p className="text-sm text-slate-500">Titre Foncier</p>
                  </div>
                </div>
              </div>
              <div className="card legal-in-process">
                <div className="card-body flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                    <span className="text-xl font-bold text-amber-700">
                      {summary.by_legal_status['In-Process']}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">In Process</p>
                    <p className="text-sm text-slate-500">Réquisition</p>
                  </div>
                </div>
              </div>
              <div className="card legal-melkia">
                <div className="card-body flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                    <span className="text-xl font-bold text-rose-700">
                      {summary.by_legal_status.Melkia}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Melkia</p>
                    <p className="text-sm text-slate-500">Traditional</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Filters */}
          <section className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Filter Properties
            </h2>
            <LegalStatusFilter activeStatuses={statusFilter} />
          </section>

          {/* Properties Table */}
          <section>
            <PropertiesTable properties={properties} />
          </section>
        </Suspense>
      </div>
    </div>
  );
}
