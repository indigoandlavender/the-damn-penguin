'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// =============================================================================
// LOGIN FORM COMPONENT
// =============================================================================

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        window.location.href = redirect;
      } else {
        setError('Invalid access code');
      }
    } catch {
      setError('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="password"
          className="mb-2 block font-mono text-[10px] uppercase tracking-widest opacity-50"
        >
          Access Code
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          autoComplete="current-password"
          autoFocus
          className="w-full border-b border-[#EEEEEE] bg-transparent py-3 font-mono text-sm tracking-wider outline-none transition-colors focus:border-black"
        />
      </div>

      {error && (
        <p className="font-mono text-xs uppercase tracking-wider text-black">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading || !password}
        className={`
          w-full border border-black bg-black py-3 font-mono text-xs
          uppercase tracking-widest text-white transition-all
          hover:bg-white hover:text-black
          disabled:cursor-not-allowed disabled:opacity-30
        `}
      >
        {isLoading ? 'Verifying...' : 'Enter'}
      </button>
    </form>
  );
}

// =============================================================================
// LOGIN PAGE — Password Gate
// =============================================================================

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-16 text-center">
          <h1 className="font-mono text-xs font-semibold uppercase tracking-[0.3em]">
            The Damn Penguin
          </h1>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest opacity-40">
            Morocco 2026 Investment Charter
          </p>
        </div>

        {/* Form with Suspense */}
        <Suspense fallback={
          <div className="space-y-6">
            <div className="h-12 animate-pulse bg-[#F5F5F5]" />
            <div className="h-12 animate-pulse bg-[#F5F5F5]" />
          </div>
        }>
          <LoginForm />
        </Suspense>

        {/* Footer */}
        <p className="mt-16 text-center font-mono text-[10px] uppercase tracking-widest opacity-30">
          Institutional Access Only
        </p>
      </div>
    </div>
  );
}
