
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { authAdmin } from '@/lib/firebase-admin'; 
import { ensureUserProfileExists } from '@/lib/userData';

export async function POST(request: NextRequest) {
  const { idToken, additionalData } = await request.json();

  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    
    // This is the critical step: get the full user record from Auth
    const user = await authAdmin.getUser(decodedToken.uid);
    if (user) {
        // Now, ensure the profile exists in Firestore, passing any extra data from sign-up form
        await ensureUserProfileExists(user, additionalData || {});
    } else {
        // This case is unlikely if verifyIdToken succeeds, but it's good practice
        throw new Error('User not found in Firebase Auth despite valid token.');
    }

    const sessionCookie = await authAdmin.createSessionCookie(idToken, { expiresIn });

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
            const decodedClaims = await authAdmin.verifySessionCookie(sessionCookie);
            await authAdmin.revokeRefreshTokens(decodedClaims.sub);
        } catch (error) {
            // Session cookie is invalid or expired.
            // No need to throw an error, just clear the cookie.
        }
    }
    return NextResponse.json({ status: 'success' }, { status: 200 });
}
