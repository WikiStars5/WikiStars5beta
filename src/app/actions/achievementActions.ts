
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

interface AchievementResult {
  unlocked: boolean;
  message?: string;
  achievementId?: string;
}

/**
 * A generic function to grant an achievement to a user if they don't already have it.
 * This function is idempotent.
 * @param userId - The ID of the user to grant the achievement to.
 * @param achievementId - The key of the achievement to grant (e.g., 'first_glance').
 * @param achievementMessage - The message to return upon unlocking.
 * @returns An object indicating if the achievement was newly unlocked and the unlock message.
 */
async function grantAchievement(
  userId: string,
  achievementId: string,
  achievementMessage: string
): Promise<AchievementResult> {
  if (!userId || !achievementId) {
    return { unlocked: false, message: 'User ID and Achievement ID are required.' };
  }

  // Standardizing collection name to 'users'
  const userDocRef = doc(db, 'users', userId);

  try {
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return { unlocked: false, message: 'User profile not found.' };
    }

    const userData = userDocSnap.data() as UserProfile;
    const achievements = userData.achievements || [];

    if (achievements.includes(achievementId)) {
      return { unlocked: false };
    }

    await updateDoc(userDocRef, {
      achievements: arrayUnion(achievementId)
    });

    return { 
      unlocked: true, 
      message: achievementMessage,
      achievementId: achievementId
    };

  } catch (error: any) {
    console.error(`Error granting "${achievementId}" achievement:`, error);
    return { unlocked: false, message: 'Error al verificar o conceder el logro.' };
  }
}

export async function grantFirstGlanceAchievement(userId: string): Promise<AchievementResult> {
  return grantAchievement(
    userId,
    'first_glance',
    '¡Explorador novato! Has dado tu primer paso en el universo de la percepción real.'
  );
}

export async function grantActitudDefinidaAchievement(userId: string): Promise<AchievementResult> {
    return grantAchievement(
        userId,
        'actitud_definida',
        '¡Tu opinión cuenta! Has definido tu actitud. ¡Gracias por tu perspectiva!'
    );
}

export async function grantEmocionAlDescubiertoAchievement(userId: string): Promise<AchievementResult> {
    return grantAchievement(
        userId,
        'emocion_descubierta',
        '¡Conectando emociones! Has expresado cómo te sientes. ¡Tu empatía es valiosa!'
    );
}
