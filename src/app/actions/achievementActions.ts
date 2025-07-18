
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

// This file will contain all Server Actions related to achievements.

interface AchievementResult {
  unlocked: boolean;
  message?: string;
}

/**
 * Grants the 'first_glance' achievement to a user if they don't already have it.
 * This action is idempotent - it will not do anything if the achievement is already unlocked.
 * @param userId - The ID of the user to grant the achievement to.
 * @returns An object indicating if the achievement was newly unlocked.
 */
export async function grantFirstGlanceAchievement(userId: string): Promise<AchievementResult> {
  if (!userId) {
    return { unlocked: false, message: 'User ID is required.' };
  }

  const userDocRef = doc(db, 'registered_users', userId);

  try {
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      // This case should ideally not happen if user profiles are created on signup.
      return { unlocked: false, message: 'User profile not found.' };
    }

    const userData = userDocSnap.data() as UserProfile;
    const achievements = userData.achievements || [];

    if (achievements.includes('first_glance')) {
      // User already has the achievement, so we don't need to do anything.
      return { unlocked: false };
    }

    // User does not have the achievement, grant it.
    await updateDoc(userDocRef, {
      achievements: arrayUnion('first_glance')
    });

    return { 
      unlocked: true, 
      message: '¡Explorador novato! Has dado tu primer paso en el universo de la percepción real.' 
    };

  } catch (error: any) {
    console.error('Error granting "first_glance" achievement:', error);
    return { unlocked: false, message: 'Error al verificar o conceder el logro.' };
  }
}
