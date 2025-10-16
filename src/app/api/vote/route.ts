
import { NextResponse, type NextRequest } from 'next/server';
import * as admin from 'firebase-admin';
import type { Figure, AttitudeKey } from '@/lib/types';

// --- Firebase Admin SDK Initialization ---
// This pattern ensures that the SDK is initialized only once.
// IMPORTANT: You'll need to set the required environment variables in Vercel.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The private key must be stored in a Vercel environment variable.
        // It needs to be formatted correctly, replacing newline characters.
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

const db = admin.firestore();

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    
    // Verify the ID token to get user information
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    if (!userId) {
       return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    
    // Parse the request body
    const { figureId, newVote, previousVote } = await request.json() as {
      figureId: string;
      newVote: AttitudeKey | null;
      previousVote: AttitudeKey | null;
    };

    if (!figureId) {
      return NextResponse.json({ error: 'Figure ID is required.' }, { status: 400 });
    }

    const figureRef = db.collection('figures').doc(figureId);
    
    // Non-transactional approach for simplicity and robustness in this environment
    const figureDoc = await figureRef.get();
    if (!figureDoc.exists) {
        return NextResponse.json({ error: 'Figure not found.' }, { status: 404 });
    }

    const currentData = figureDoc.data() as Figure;
    const attitudeCounts = currentData.attitudeCounts || {
        neutral: 0, fan: 0, simp: 0, hater: 0
    };
    const newAttitudeCounts = { ...attitudeCounts };

    if (previousVote && typeof newAttitudeCounts[previousVote] === 'number') {
        newAttitudeCounts[previousVote] = Math.max(0, newAttitudeCounts[previousVote] - 1);
    }
    if (newVote) {
        newAttitudeCounts[newVote] = (newAttitudeCounts[newVote] || 0) + 1;
    }
    
    await figureRef.update({
        attitudeCounts: newAttitudeCounts
    });
    
    return NextResponse.json({ success: true, data: newAttitudeCounts });

  } catch (error: any) {
    console.error('Error in /api/vote:', error);
    if (error.code === 'auth/id-token-expired') {
        return NextResponse.json({ error: 'Token expired, please re-authenticate.' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
