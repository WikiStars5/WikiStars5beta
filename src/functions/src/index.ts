/**
 * This file is the new home for all server-side logic that requires admin privileges.
 * By using onCall functions, we ensure a secure and stable separation between
 * client-side Next.js code and server-side Firebase Admin SDK operations,
 * which resolves the persistent build errors.
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions/v2";
import * as admin from "firebase-admin";
import type { Figure, UserProfile, AttitudeKey, StarValueAsString, EmotionKey } from "../../lib/types"; // Adjust path as necessary
import type { DocumentData, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Centralized Admin UID for security checks.
const ADMIN_UID = 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// For cost control, you can set the maximum number of containers that can be
// running at the same time.
setGlobalOptions({maxInstances: 10, region: "us-central1"});


const convertTimestampToString = (timestamp: any): string | undefined => {
  if (!timestamp) return undefined;
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  return undefined;
};

const mapDocToUserProfile = (uid: string, data: DocumentData): UserProfile => {
  const createdAt = convertTimestampToString(data.createdAt) || new Date().toISOString();
  return {
    uid,
    email: data.email || null,
    username: data.username || '',
    country: data.country || '',
    countryCode: data.countryCode || '',
    gender: data.gender || '', 
    photoURL: data.photoURL || null,
    role: data.role || 'user',
    createdAt: createdAt,
    lastLoginAt: convertTimestampToString(data.lastLoginAt),
    fcmToken: data.fcmToken || undefined,
    achievements: data.achievements || [], // Ensure achievements array exists
  };
};

const mapDocToFigure = (docSnap: QueryDocumentSnapshot): Figure => {
  const data = docSnap.data();
  const createdAtTimestamp = data.createdAt;
  
  return {
    id: docSnap.id,
    name: data.name || "",
    nameLower: data.nameLower || (data.name ? data.name.toLowerCase() : ""),
    photoUrl: data.photoUrl || "",
    description: data.description || "",
    nationality: data.nationality || "",
    occupation: data.occupation || "",
    gender: data.gender || "",
    category: data.category || "",
    sportSubcategory: data.sportSubcategory || "",
    alias: data.alias || "",
    species: data.species || "", 
    firstAppearance: data.firstAppearance || "", 
    birthDateOrAge: data.birthDateOrAge || "", 
    birthPlace: data.birthPlace || "",
    statusLiveOrDead: data.statusLiveOrDead || "", 
    maritalStatus: data.maritalStatus || "", 
    height: data.height || "",
    weight: data.weight || "", 
    hairColor: data.hairColor || "",
    eyeColor: data.eyeColor || "", 
    distinctiveFeatures: data.distinctiveFeatures || "", 
    perceptionCounts: data.perceptionCounts || {},
    attitudeCounts: data.attitudeCounts || {},
    starRatingCounts: data.starRatingCounts || {},
    commentCount: data.commentCount || 0, 
    createdAt: createdAtTimestamp && typeof createdAtTimestamp.toDate === 'function' 
                 ? createdAtTimestamp.toDate().toISOString() 
                 : undefined,
    status: data.status || 'approved', 
    isFeatured: data.isFeatured || false,
  };
};

// Callable function to get all users, now with admin check
export const getAllUsers = onCall(async (request) => {
    // Authentication check to ensure only admins can call this
    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    // Check if the caller is the designated admin
    if (uid !== ADMIN_UID) {
        throw new HttpsError('permission-denied', 'Only admins can call this function.');
    }

    try {
        // CORRECTED: Reading from the 'registered_users' collection, where profiles are actually stored.
        const usersCollectionRef = db.collection('registered_users');
        const querySnapshot = await usersCollectionRef.get();

        const users: UserProfile[] = [];
        if (!querySnapshot.empty) {
            querySnapshot.forEach((docSnap) => {
                users.push(mapDocToUserProfile(docSnap.id, docSnap.data()));
            });
        }
        
        users.sort((a, b) => a.username.localeCompare(b.username));
        
        return { success: true, users: users };

    } catch (error: any) {
        console.error("Error fetching all users from Cloud Function:", error);
        if (error.code === 'permission-denied' || String(error.message).toLowerCase().includes("permission")) {
            return { success: false, error: 'Error de permisos de Firestore en la Cloud Function. Revisa las reglas de seguridad o los permisos de la cuenta de servicio.' };
        }
        return { success: false, error: error.message || 'Un error desconocido ocurrió en la Cloud Function.' };
    }
});


// New callable function for recommendations
export const getForYouRecommendations = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError('unauthenticated', 'You must be logged in to get recommendations.');
    }

    try {
        let userProfile: UserProfile | null = null;
        const ratedFigureIds = new Set<string>();

        const userDocRef = db.collection('registered_users').doc(uid);
        const userStarRatingsRef = db.collection('userStarRatings').where('userId', '==', uid);
        const userCommentsRef = db.collection('userComments').where('userId', '==', uid);

        const [userDocSnap, ratingsSnap, commentsSnap] = await Promise.all([
            userDocRef.get(),
            userStarRatingsRef.get(),
            userCommentsRef.get(),
        ]);

        if (userDocSnap.exists) {
            userProfile = mapDocToUserProfile(userDocSnap.id, userDocSnap.data()!);
        }

        ratingsSnap.forEach(doc => ratedFigureIds.add(doc.data().figureId));
        commentsSnap.forEach(doc => ratedFigureIds.add(doc.data().figureId));

        const recommendations: { title: string; description: string; figures: Figure[] }[] = [];
        const recommendedIds = new Set<string>(ratedFigureIds);

        // 1. Featured Figures
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

        // 2. Popular in User's Country
        if (userProfile?.nationality) {
            try {
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
                        title: `Populares en el país de ${userProfile.username}`,
                        description: `Descubre qué figuras de tu país están generando más conversación.`,
                        figures: countryFigures,
                    });
                    countryFigures.forEach(f => recommendedIds.add(f.id));
                }
            } catch (error) {
                console.error("Error fetching country popular figures (index might be required):", error);
            }
        }
        
        // 3. New and Trending
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        try {
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
            }
        } catch(error) {
            console.error("Error fetching new and trending figures (composite index might be required):", error);
        }

        return { success: true, recommendations };

    } catch (error: any) {
        console.error("Error generating recommendations from Cloud Function:", error);
        return { success: false, error: error.message || 'An unknown error occurred.' };
    }
});


// The push notification function has been moved to its own file in `src/functions/src/notifications.ts`
// for better organization, but for simplicity here we keep it. If you need more functions, split them.
export { sendPushNotification } from './notifications';
