
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { cookies } from 'next/headers';
import { auth } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { Figure, UserComment, UserStarRating } from './types';
import { getFiguresByIds, getAllFiguresFromFirestore } from './placeholder-data';
import * as admin from 'firebase-admin';

const db = getFirestore();

async function getCurrentUserId(): Promise<string | null> {
  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) return null;

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    return decodedClaims.uid;
  } catch (error) {
    return null;
  }
}

const RecommendationInputSchema = z.object({
  allFigures: z.array(z.object({ id: z.string(), name: z.string(), categories: z.array(z.string()).optional() })).describe("A list of all possible figures to choose from."),
  positiveRatedFigures: z.array(z.object({ id: z.string(), name: z.string() })).describe("Figures the user has rated with 4 or 5 stars."),
  commentedOnFigures: z.array(z.object({ id: z.string(), name: z.string() })).describe("Figures the user has commented on."),
  ratedOrCommentedIds: z.array(z.string()).describe("A list of IDs for all figures the user has already interacted with (rated or commented on)."),
});

const RecommendationOutputSchema = z.object({
  recommendations: z.array(z.object({
    figureId: z.string().describe("The ID of the recommended figure."),
    reason: z.string().describe("A brief, user-facing reason for the recommendation (e.g., 'Because you liked Cristiano Ronaldo')."),
  })).describe("A list of up to 12 recommended figures, sorted by relevance."),
});

const recommendationFlow = ai.defineFlow(
  {
    name: 'recommendationFlow',
    inputSchema: RecommendationInputSchema,
    outputSchema: RecommendationOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `You are a recommendation engine for a celebrity wiki. Your task is to recommend new figures to a user based on their activity.

      CONTEXT:
      - The user has positively rated (4 or 5 stars) the following figures: ${JSON.stringify(input.positiveRatedFigures)}
      - The user has commented on the following figures: ${JSON.stringify(input.commentedOnFigures)}
      - Here is the complete list of available figures to choose from: ${JSON.stringify(input.allFigures.map(f => ({id: f.id, name: f.name, categories: f.categories?.join(', ')})))}

      TASK:
      1. Analyze the user's rated and commented figures to understand their interests (e.g., actors, musicians, athletes).
      2. From the "allFigures" list, select up to 12 figures that are similar or related to the user's interests.
      3. CRUCIAL: Exclude any figures whose IDs are present in the 'ratedOrCommentedIds' list. The user must not have seen them before.
      4. For each recommendation, provide a brief, engaging reason why the user might like them. The reason should reference a specific figure the user has liked or commented on.
      5. Return the list of recommended figure IDs and the reasons. The list should be sorted by how confident you are in the recommendation.
      `,
      output: {
        schema: RecommendationOutputSchema,
      },
      config: {
        temperature: 0.5,
      },
    });
    return output || { recommendations: [] };
  }
);


export async function getForYouFigures(): Promise<{ figures: Figure[]; reason: 'recommended' | 'no-user' | 'no-activity' }> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return { figures: [], reason: 'no-user' };
  }

  // 1. Get user's activity
  const ratingsQuery = query(collection(db, 'userStarRatings'), where('userId', '==', userId));
  const commentsQuery = query(collection(db, 'userComments'), where('userId', '==', userId), where('parentId', '==', null));

  const [ratingsSnapshot, commentsSnapshot] = await Promise.all([
    getDocs(ratingsQuery),
    getDocs(commentsQuery),
  ]);

  const positiveRatedFigureIds = new Set<string>();
  const allRatedFigureIds = new Set<string>();
  ratingsSnapshot.forEach(doc => {
    const rating = doc.data() as UserStarRating;
    allRatedFigureIds.add(rating.figureId);
    if (rating.starValue >= 4) {
      positiveRatedFigureIds.add(rating.figureId);
    }
  });

  const commentedOnFigureIds = new Set<string>();
  commentsSnapshot.forEach(doc => {
    const comment = doc.data() as UserComment;
    commentedOnFigureIds.add(comment.figureId);
  });

  const interactedFigureIds = Array.from(new Set([...allRatedFigureIds, ...commentedOnFigureIds]));

  if (interactedFigureIds.length === 0) {
    return { figures: [], reason: 'no-activity' };
  }

  // 2. Get details for the figures the user liked
  const [positiveRatedFigures, commentedOnFigures, allFigures] = await Promise.all([
    getFiguresByIds(Array.from(positiveRatedFigureIds)),
    getFiguresByIds(Array.from(commentedOnFigureIds)),
    getAllFiguresFromFirestore(),
  ]);

  // 3. Run the AI recommendation flow
  const aiInput = {
    allFigures: allFigures.map(f => ({ id: f.id, name: f.name, categories: f.categories })),
    positiveRatedFigures: positiveRatedFigures.map(f => ({ id: f.id, name: f.name })),
    commentedOnFigures: commentedOnFigures.map(f => ({ id: f.id, name: f.name })),
    ratedOrCommentedIds: interactedFigureIds,
  };
  
  try {
    const result = await recommendationFlow(aiInput);
    const recommendedIds = result.recommendations.map(r => r.figureId);

    if (recommendedIds.length === 0) {
      return { figures: [], reason: 'recommended' }; // AI found no new items
    }

    const recommendedFigures = await getFiguresByIds(recommendedIds);
    return { figures: recommendedFigures, reason: 'recommended' };
    
  } catch (error) {
    console.error("Error getting AI recommendations, falling back to simple shuffle.", error);
    // Fallback logic in case of AI error
    const nonInteractedFigures = allFigures.filter(f => !interactedFigureIds.includes(f.id));
    const shuffled = nonInteractedFigures.sort(() => 0.5 - Math.random());
    return { figures: shuffled.slice(0, 12), reason: 'recommended' };
  }
}

// Helper to query Firestore collections with type safety
async function getDocs<T>(q: admin.firestore.Query): Promise<admin.firestore.QueryDocumentSnapshot<T>[]> {
  const snapshot = await q.get();
  return snapshot.docs as admin.firestore.QueryDocumentSnapshot<T>[];
}

async function getDoc<T>(ref: admin.firestore.DocumentReference<T>): Promise<admin.firestore.DocumentSnapshot<T>> {
    const snapshot = await ref.get();
    return snapshot as admin.firestore.DocumentSnapshot<T>;
}

function query<T>(ref: admin.firestore.CollectionReference<T>, ...constraints: any[]): admin.firestore.Query<T> {
    return ref.where.apply(ref, constraints);
}

function collection<T>(db: admin.firestore.Firestore, path: string): admin.firestore.CollectionReference<T> {
    return db.collection(path) as admin.firestore.CollectionReference<T>;
}

function where(field: string, op: admin.firestore.WhereFilterOp, value: any): any {
    return {field, op, value}; // This is a mock for correct typing, the apply handles it.
}
