
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Figure } from '@/lib/types';
import { correctMalformedUrl } from '@/lib/utils';

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

export async function batchUpdateFigureImageUrls(): Promise<{ success: boolean; message: string; updatedCount: number }> {
  try {
    const figuresCollectionRef = collection(db, 'figures');
    const querySnapshot = await getDocs(figuresCollectionRef);
    
    if (querySnapshot.empty) {
      return { success: true, message: 'No hay figuras para procesar.', updatedCount: 0 };
    }

    const batch = writeBatch(db);
    let updatedCount = 0;

    querySnapshot.forEach((docSnap) => {
      const figure = docSnap.data() as Figure;
      let needsUpdate = false;
      const updates: Partial<Figure> = {};

      // 1. Check main photoUrl
      const originalPhotoUrl = figure.photoUrl;
      const correctedPhotoUrl = correctMalformedUrl(originalPhotoUrl);
      if (originalPhotoUrl !== correctedPhotoUrl) {
        updates.photoUrl = correctedPhotoUrl;
        needsUpdate = true;
      }

      // 2. Check familyMembers photoUrls
      if (figure.familyMembers && Array.isArray(figure.familyMembers)) {
        let familyMembersChanged = false;
        const correctedFamilyMembers = figure.familyMembers.map(member => {
          const originalMemberPhotoUrl = member.photoUrl;
          const correctedMemberPhotoUrl = correctMalformedUrl(originalMemberPhotoUrl);
          if (originalMemberPhotoUrl !== correctedMemberPhotoUrl) {
            familyMembersChanged = true;
            return { ...member, photoUrl: correctedMemberPhotoUrl };
          }
          return member;
        });

        if (familyMembersChanged) {
            updates.familyMembers = correctedFamilyMembers;
            needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        const figureRef = doc(db, 'figures', docSnap.id);
        batch.update(figureRef, updates);
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      // Revalidate paths to reflect changes
      revalidatePath('/figures', 'layout');
      revalidatePath('/admin/figures', 'page');
    }

    return { 
      success: true, 
      message: `Proceso completado. Se actualizaron las URLs de ${updatedCount} figuras.`,
      updatedCount 
    };

  } catch (error: any) {
    console.error('Error in batchUpdateFigureImageUrls:', error);
    let errorMessage = `Error durante la actualización por lotes: ${error.message}`;
    // Provide a more specific error message for permission denied
    if (error.code === 'permission-denied' || (error.message && String(error.message).toLowerCase().includes("permission"))) {
        errorMessage = `Error de Permiso: La operación fue bloqueada por las Reglas de Seguridad de Firestore. Asegúrate de que el administrador (UID: ${ADMIN_UID_FOR_MESSAGE}) tenga permiso de 'list' y 'write' en la colección 'figures'. Copia las reglas actualizadas de 'src/lib/firebase.ts' y aplícalas en tu consola de Firebase.`;
    }
    return { success: false, message: errorMessage, updatedCount: 0 };
  }
}
