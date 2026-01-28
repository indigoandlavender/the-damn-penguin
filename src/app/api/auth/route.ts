import { NextResponse } from 'next/server';

// =============================================================================
// CONFIGURATION
// =============================================================================

const PROTECTED_PASSWORD = 'c0usc0us*2344';
const AUTH_COOKIE_NAME = 'tdp_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// =============================================================================
// AUTH API — Verify Password & Set Cookie
// =============================================================================

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (password !== PROTECTED_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Create response with auth cookie
    const response = NextResponse.json({ success: true });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: hashPassword(PROTECTED_PASSWORD),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// =============================================================================
// LOGOUT — Clear Cookie
// =============================================================================

export async function DELETE() {
  const response = NextResponse.json({ success: true });

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}

// =============================================================================
// UTILITY
// =============================================================================

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
