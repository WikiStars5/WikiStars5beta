
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { ensureUserProfileExists } from '@/lib/userData';

export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Ensure user profile exists in Firestore after login
    // This is important for new sign-ups to have their data available for recommendations.
    const user = await auth.getUser(decodedToken.uid);
    if (user) {
        // We pass an empty object as we don't have country/gender info here.
        // It will be populated on first visit to the signup form or profile page if needed.
        await ensureUserProfileExists(user, {});
    }

    cookies().set('__session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    
    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error) {
    console.error("Session login error:", error);
    return NextResponse.json({ status: 'error', message: 'Failed to create session' }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
    const sessionCookie = cookies().get('__session')?.value
    if (sessionCookie) {
        cookies().delete('__session');
        try {
            const decodedClaims = await auth.verifySessionCookie(sessionCookie);
            await auth.revokeRefreshTokens(decodedClaims.sub);
        } catch (error) {
            // Session cookie is invalid or expired.
            // No need to throw an error, just clear the cookie.
        }
    }
    return NextResponse.json({ status: 'success' }, { status: 200 });
}
