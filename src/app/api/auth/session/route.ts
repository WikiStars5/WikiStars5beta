
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

    // Now, ensure the profile exists in Firestore, passing any extra data from sign-up form
    await ensureUserProfileExists(user, additionalData || {});
   
    const sessionCookie = await authAdmin.createSessionCookie(idToken, { expiresIn });

    cookies().set('__session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    
    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error: any) {
    console.error("Session login error:", error);
    return NextResponse.json({ status: 'error', message: `Failed to create session: ${error.message}` }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
    const sessionCookie = cookies().get('__session')?.value;
    // Always delete the cookie from the browser regardless of its validity.
    cookies().delete('__session');
    
    if (sessionCookie) {
        try {
            // Verify the session cookie. The second argument `true` checks for revocation.
            const decodedClaims = await authAdmin.verifySessionCookie(sessionCookie, true);
            // If verification is successful, revoke the refresh tokens.
            await authAdmin.revokeRefreshTokens(decodedClaims.sub);
        } catch (error) {
            // This block will be entered if the session cookie is invalid, expired, or revoked.
            // This is an expected condition during logout and should not be treated as a server error.
            // We can log it for debugging but must not throw an error.
            console.log("Could not revoke session cookie, it was likely already invalid:", error);
        }
    }
    
    // Always return a success response to ensure a smooth logout experience for the user.
    return NextResponse.json({ status: 'success' }, { status: 200 });
}
