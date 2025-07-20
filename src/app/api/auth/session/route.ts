
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-for-wikistars5-app-please-change';
const secret = new TextEncoder().encode(JWT_SECRET);

// This API route is used to set the session token as a cookie.
// This is called from the client-side login form upon successful login.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token } = body;

  if (!token) {
    return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
  }

  try {
    // Verify the token before setting the cookie to ensure it's valid
    await jose.jwtVerify(token, secret);

    cookies().set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
      sameSite: 'lax',
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid token or failed to set cookie' }, { status: 500 });
  }
}

// This API route is used to clear the session cookie on logout.
export async function DELETE() {
  try {
    cookies().delete('session_token');
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete cookie' }, { status: 500 });
  }
}

// This API route gets the current session from the cookie
export async function GET() {
    const token = cookies().get('session_token')?.value;

    if (!token) {
        return NextResponse.json({ session: null });
    }

    try {
        const { payload } = await jose.jwtVerify(token, secret);
        return NextResponse.json({ session: payload });
    } catch (error) {
        // Invalid token, clear it
        cookies().delete('session_token');
        return NextResponse.json({ session: null });
    }
}
