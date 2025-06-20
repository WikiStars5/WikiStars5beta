'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Figure } from '@/lib/types';

export async function toggleFigureFeaturedStatus(
  figureId: string
): Promise<{ success: boolean; newStatus?: boolean; message?: string }> {
  if (!figureId) {
    return { success: false, message: 'ID de figura no proporcionado.' };
  }

  const figureRef = doc(db, 'figures', figureId);

  try {
    const figureSnap = await getDoc(figureRef);
    if (!figureSnap.exists()) {
      return { success: false, message: 'Figura no encontrada.' };
    }

    const currentFigureData = figureSnap.data() as Figure;
    const newStatus = !(currentFigureData.isFeatured || false); // Ensure current is boolean

    await updateDoc(figureRef, {
      isFeatured: newStatus,
    });

    // Revalidate all relevant paths where featured figures might be displayed or listed
    const locales = ['en', 'es', 'pt']; // Assuming these are your supported locales
    locales.forEach(locale => {
      revalidatePath(`/${locale}/admin/figures`, 'page');
      revalidatePath(`/${locale}/home`, 'page');
      revalidatePath(`/${locale}/figures`, 'page');
    });
    // Also revalidate non-locale specific paths if they are used (e.g. default locale without prefix)
    revalidatePath('/admin/figures', 'page');
    revalidatePath('/home', 'page');
    revalidatePath('/figures', 'page');


    return { success: true, newStatus, message: `Figura ${newStatus ? 'marcada como destacada' : 'desmarcada como destacada'}.` };
  } catch (error: any) {
    console.error('Error toggling figure featured status:', error);
    return { success: false, message: `Error al cambiar estado: ${error.message}` };
  }
}
