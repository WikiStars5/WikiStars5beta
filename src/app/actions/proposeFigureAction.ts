
"use server";

import { db } from '@/lib/firebase';
import type { Figure } from '@/lib/types';
import { collection, doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import slugify from 'slugify';

interface ProposeFigureFormData {
  name: string;
  description?: string;
  proposedWikiLink: string;
  nationality?: string;
  occupation?: string;
  gender?: string;
}

const PLACEHOLDER_IMAGE_URL = 'https://placehold.co/400x600.png';

export async function proposeNewFigure(
  formData: ProposeFigureFormData,
  userId: string
): Promise<{ success: boolean; message?: string; figureId?: string }> {
  if (!userId) {
    return { success: false, message: "Usuario no autenticado." };
  }

  // Validate required fields
  if (!formData.name || !formData.name.trim()) {
    return { success: false, message: "El nombre de la figura es obligatorio." };
  }
  if (!formData.proposedWikiLink || !formData.proposedWikiLink.trim()) {
    return { success: false, message: "El enlace a Wikipedia/Fandom es obligatorio." };
  }

  // Validate link format and domain (basic client-side validation is good, but server re-validates)
  try {
    const url = new URL(formData.proposedWikiLink);
    if (!url.hostname.endsWith('wikipedia.org') && !url.hostname.endsWith('fandom.com')) {
      return { success: false, message: "El enlace debe ser de wikipedia.org o fandom.com." };
    }
  } catch (e) {
    return { success: false, message: "El enlace proporcionado no es una URL válida." };
  }

  const figureId = slugify(formData.name.trim(), { lower: true, strict: true });
  if (!figureId) {
    return { success: false, message: "No se pudo generar un ID para la figura a partir del nombre." };
  }

  const figureRef = doc(db, 'figures', figureId);

  try {
    // Check if figure already exists (by ID)
    const existingFigureSnap = await getDoc(figureRef);
    if (existingFigureSnap.exists()) {
      const existingData = existingFigureSnap.data() as Figure;
      if (existingData.status === 'approved') {
        return { success: false, message: `La figura "${formData.name}" ya existe y está aprobada.` };
      } else if (existingData.status === 'pending_verification') {
        return { success: false, message: `La figura "${formData.name}" ya ha sido propuesta y está pendiente de revisión.` };
      }
      // If rejected, allow reproposal? For now, let's treat it as already processed.
      // Or simply overwrite if rejected? For now, prevent re-proposal if any entry exists with this ID.
      // return { success: false, message: `Una propuesta para "${formData.name}" ya fue procesada.` };
    }

    const newFigureData: Figure = {
      id: figureId,
      name: formData.name.trim(),
      nameLower: formData.name.trim().toLowerCase(),
      description: formData.description?.trim() || "",
      photoUrl: PLACEHOLDER_IMAGE_URL, // Placeholder image for user proposals
      nationality: formData.nationality?.trim() || "",
      occupation: formData.occupation?.trim() || "",
      gender: formData.gender?.trim() || "",
      proposedWikiLink: formData.proposedWikiLink.trim(),
      status: 'pending_verification',
      proposedBy: userId,
      createdAt: serverTimestamp() as unknown as string, // Firestore will convert this
      perceptionCounts: { alegria: 0, envidia: 0, tristeza: 0, miedo: 0, desagrado: 0, furia: 0 },
      attitudeCounts: { neutral: 0, fan: 0, simp: 0, hater: 0 },
    };

    await setDoc(figureRef, newFigureData);

    return { success: true, message: "Propuesta enviada exitosamente.", figureId: figureId };

  } catch (error: any) {
    console.error("Error proposing new figure:", error);
    return { success: false, message: error.message || "Ocurrió un error en el servidor al procesar la propuesta." };
  }
}
