
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { UserProfile } from '@/lib/types';

export async function toggleFavoriteFigure(
  userId: string,
  figureId: string
): Promise<{ success: boolean; isFavorited: boolean; message: string }> {
  if (!userId || !figureId) {
    return { success: false, isFavorited: false, message: 'Faltan el ID de usuario o de figura.' };
  }

  const userDocRef = doc(db, 'registered_users', userId);

  try {
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      return { success: false, isFavorited: false, message: 'Perfil de usuario no encontrado.' };
    }

    const userProfile = userDocSnap.data() as UserProfile;
    const isCurrentlyFavorited = userProfile.favoriteFigures?.includes(figureId) || false;

    if (isCurrentlyFavorited) {
      // Remove from favorites
      await updateDoc(userDocRef, {
        favoriteFigures: arrayRemove(figureId),
      });
      revalidatePath('/profile');
      return { success: true, isFavorited: false, message: 'Eliminado de favoritos.' };
    } else {
      // Add to favorites
      await updateDoc(userDocRef, {
        favoriteFigures: arrayUnion(figureId),
      });
      revalidatePath('/profile');
      return { success: true, isFavorited: true, message: 'Añadido a favoritos.' };
    }
  } catch (error: any) {
    console.error('Error toggling favorite figure:', error);
    return { success: false, isFavorited: isCurrentlyFavorited, message: 'No se pudo actualizar los favoritos.' };
  }
}
