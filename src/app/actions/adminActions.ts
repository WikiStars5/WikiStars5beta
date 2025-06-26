
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Figure } from '@/lib/types';

const ADMIN_UID_FOR_MESSAGE = 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'; 

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
    revalidatePath('/admin/figures', 'page');
    revalidatePath('/home', 'page');
    revalidatePath('/figures', 'page');


    return { success: true, newStatus, message: `Figura ${newStatus ? 'marcada como destacada' : 'desmarcada como destacada'}.` };
  } catch (error: any) {
    console.error('Error toggling figure featured status:', error);
    let errorMessage = `Error al cambiar estado: ${error.message}`;
    if (error.code === 'permission-denied' || (error.message && String(error.message).toLowerCase().includes("permission"))) {
        errorMessage = `Error al cambiar estado: Permisos insuficientes. Verifica las Reglas de Seguridad de Firestore. Asegúrate de que el administrador (UID: ${ADMIN_UID_FOR_MESSAGE}) tenga permiso de 'write'.`;
    }
    return { success: false, message: errorMessage };
  }
}
