
'use server';

import { getAuth } from "firebase-admin/auth";
import { db } from "@/lib/firebase-admin";
import type { Figure, UserProfile } from "@/lib/types";
import { mapDocToFigure } from "@/lib/placeholder-data";
import { cookies } from "next/headers";

interface RecommendationSection {
  title: string;
  description: string;
  figures: Figure[];
}

// Helper to get user profile and rated figures
async function getUserContext(uid: string): Promise<{ userProfile: UserProfile | null; ratedFigureIds: Set<string> }> {
  let userProfile: UserProfile | null = null;
  const ratedFigureIds = new Set<string>();

  const userDocRef = db.collection('registered_users').doc(uid);
  const userStarRatingsRef = db.collection('userStarRatings').where('userId', '==', uid);
  const userCommentsRef = db.collection('userComments').where('userId', '==', uid);

  try {
    const [userDocSnap, ratingsSnap, commentsSnap] = await Promise.all([
      userDocRef.get(),
      userStarRatingsRef.get(),
      userCommentsRef.get(),
    ]);

    if (userDocSnap.exists) {
      const data = userDocSnap.data() as UserProfile;
      userProfile = {
        ...data,
        uid: userDocSnap.id,
      };
    }

    ratingsSnap.forEach(doc => ratedFigureIds.add(doc.data().figureId));
    commentsSnap.forEach(doc => ratedFigureIds.add(doc.data().figureId));

  } catch (error) {
    console.error("Error fetching user context:", error);
  }

  return { userProfile, ratedFigureIds };
}


export async function getForYouRecommendations(): Promise<RecommendationSection[]> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  let userId: string | null = null;
  
  if (sessionCookie) {
    try {
      const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true);
      userId = decodedClaims.uid;
    } catch (error) {
      // Session cookie is invalid.
      console.warn("Invalid session cookie found.");
    }
  }

  if (!userId) {
    console.log("No authenticated user found for recommendations.");
    return [];
  }
  
  const { userProfile, ratedFigureIds } = await getUserContext(userId);
  const recommendations: RecommendationSection[] = [];
  const recommendedIds = new Set<string>(ratedFigureIds); // Keep track of all figures already included

  // 1. Featured Figures
  try {
    const featuredQuery = db.collection('figures').where('isFeatured', '==', true).limit(10);
    const featuredSnap = await featuredQuery.get();
    const featuredFigures = featuredSnap.docs
      .map(mapDocToFigure)
      .filter(f => !recommendedIds.has(f.id));

    if (featuredFigures.length > 0) {
      recommendations.push({
        title: "Selección Destacada",
        description: "Figuras populares y relevantes seleccionadas por nuestro equipo.",
        figures: featuredFigures,
      });
      featuredFigures.forEach(f => recommendedIds.add(f.id));
    }
  } catch (error) {
    console.error("Error fetching featured figures:", error)
  }

  // 2. Popular in User's Country
  if (userProfile?.country) {
    try {
      // This is a simple approximation. A more complex system would be needed for true popularity.
      const countryPopularQuery = db.collection('figures')
        .where('nationality', '==', userProfile.nationality)
        .orderBy('commentCount', 'desc')
        .limit(10);
      const countryPopularSnap = await countryPopularQuery.get();
      const countryFigures = countryPopularSnap.docs
        .map(mapDocToFigure)
        .filter(f => !recommendedIds.has(f.id));

      if (countryFigures.length > 0) {
        recommendations.push({
          title: `Populares en ${userProfile.country}`,
          description: `Descubre qué figuras de tu país están generando más conversación.`,
          figures: countryFigures,
        });
        countryFigures.forEach(f => recommendedIds.add(f.id));
      }
    } catch (error) {
        console.error("Error fetching country popular figures. This may require an index.", error);
    }
  }
  
  // 3. New and Trending
  try {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const trendingQuery = db.collection('figures')
        .where('createdAt', '>=', twoWeeksAgo)
        .orderBy('createdAt', 'desc')
        .orderBy('commentCount', 'desc')
        .limit(10);
        
    const trendingSnap = await trendingQuery.get();
    const trendingFigures = trendingSnap.docs
        .map(mapDocToFigure)
        .filter(f => !recommendedIds.has(f.id));

    if (trendingFigures.length > 0) {
        recommendations.push({
            title: "Tendencias Recientes",
            description: "Figuras nuevas que están ganando popularidad rápidamente.",
            figures: trendingFigures
        });
        trendingFigures.forEach(f => recommendedIds.add(f.id));
    }
  } catch (error) {
      console.error("Error fetching trending figures. This may require a composite index.", error);
  }

  return recommendations;
}
