import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <h1 className="text-6xl font-bold text-slate-900">404</h1>
      <p className="mt-4 text-lg text-slate-600">Property not found</p>
      <Link href="/dashboard" className="btn btn-primary btn-md mt-8">
        Back to Dashboard
      </Link>
    </div>
  );
}
