
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Figure } from '@/lib/types';
import { auth } from '@/lib/firebase'; // Usamos la auth del cliente

// No se debe usar firebase-admin aquí

export async function toggleFigureFeaturedStatus(
  figureId: string,
  callingUid: string | undefined // El UID del usuario que llama a la función
): Promise<{ success: boolean; newStatus?: boolean; message?: string }> {
  if (!figureId) {
    return { success: false, message: 'ID de figura no proporcionado.' };
  }

  if (!callingUid) {
    return { success: false, message: 'Error de autenticación. Debes estar conectado.' };
  }
  
  // Verificar si el usuario que llama es un administrador
  const userDocRef = doc(db, 'users', callingUid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists() || userDoc.data()?.role !== 'admin') {
      return { success: false, message: 'Error de permisos. Solo los administradores pueden realizar esta acción.' };
  }

  const figureRef = doc(db, 'figures', figureId);

  try {
    const figureSnap = await getDoc(figureRef);
    if (!figureSnap.exists()) {
      return { success: false, message: 'Figura no encontrada.' };
    }

    const currentFigureData = figureSnap.data() as Figure;
    const newStatus = !(currentFigureData.isFeatured || false);

    await updateDoc(figureRef, {
      isFeatured: newStatus,
    });

    // Revalidar rutas importantes donde se muestran las figuras destacadas
    revalidatePath('/admin/figures', 'page');
    revalidatePath('/', 'page');
    revalidatePath('/figures', 'page');


    return { success: true, newStatus, message: `Figura ${newStatus ? 'marcada como destacada' : 'desmarcada como destacada'}.` };
  } catch (error: any) {
    console.error('Error toggling figure featured status:', error);
    let errorMessage = `Error al cambiar estado: ${error.message}`;
    return { success: false, message: errorMessage };
  }
}
