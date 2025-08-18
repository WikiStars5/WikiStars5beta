
import { NextRequest, NextResponse } from 'next/server';
import { deleteReview as deleteReviewAction } from '@/app/actions/reviewActions';
import { headers } from 'next/headers';
import * as admin from 'firebase-admin';

// This is a new API route handler to securely call the server action.
// It acts as a bridge between the client-side fetch call and the server action,
// ensuring the Authorization header is processed correctly.

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}


async function getDecodedIdToken(): Promise<admin.auth.DecodedIdToken | null> {
  const authHeader = headers().get('Authorization');
  const idToken = authHeader?.split('Bearer ')[1];
  
  if (!idToken) {
    return null;
  }
  
  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    console.error("Error verifying ID token in API route:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await getDecodedIdToken();
    if (!decodedToken) {
      return NextResponse.json({ success: false, message: 'No estás autenticado.' }, { status: 401 });
    }

    const { reviewId, figureId } = await request.json();
    if (!reviewId || !figureId) {
      return NextResponse.json({ success: false, message: 'Falta el ID de la reseña o de la figura.' }, { status: 400 });
    }

    // Now, we call the *original server action*, but we are sure we are authenticated.
    // The server action will re-verify the user's ownership of the comment.
    // We pass the decoded token so the action can use the UID.
    const result = await deleteReviewAction(reviewId, figureId, decodedToken);

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 403 }); // Forbidden
    }
  } catch (error: any) {
    console.error('[API deleteReview] Error:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor.' }, { status: 500 });
  }
}
