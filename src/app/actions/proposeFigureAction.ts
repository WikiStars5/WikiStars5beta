
"use server";

import { db } from '@/lib/firebase';
import type { Figure } from '@/lib/types';
import { collection, doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import slugify from 'slugify';
import { verifyFigureProposal, type VerifyFigureProposalInput } from '@/ai/flows/verify-figure-proposal-flow';

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

  // Basic form data validation (schema validation happens client-side, but good to double-check)
  if (!formData.name || formData.name.trim().length < 3) { // Consistent with form validation
    return { success: false, message: "El nombre de la figura debe tener al menos 3 caracteres." };
  }
  if (!formData.proposedWikiLink || !formData.proposedWikiLink.trim()) {
    return { success: false, message: "El enlace a Wikipedia/Fandom es obligatorio." };
  }

  // Step 1: Call Genkit flow for initial link verification
  const verificationInput: VerifyFigureProposalInput = {
    figureName: formData.name.trim(),
    proposedWikiLink: formData.proposedWikiLink.trim(),
  };

  try {
    const verificationResult = await verifyFigureProposal(verificationInput);
    if (!verificationResult.isValidProposal) {
      return { success: false, message: verificationResult.message };
    }
    // If basic verification passes, continue. Message from verificationResult can be logged or ignored if positive.
    console.log("Initial proposal verification passed:", verificationResult.message);
  } catch (flowError: any) {
    console.error("Error calling verification flow:", flowError);
    return { success: false, message: `Error durante la verificación de la propuesta: ${flowError.message}` };
  }

  // Step 2: Proceed with Firestore document creation if basic verification passed
  const figureId = slugify(formData.name.trim(), { lower: true, strict: true });
  if (!figureId) {
    return { success: false, message: "No se pudo generar un ID para la figura a partir del nombre." };
  }

  const figureRef = doc(db, 'figures', figureId);

  try {
    const existingFigureSnap = await getDoc(figureRef);
    if (existingFigureSnap.exists()) {
      const existingData = existingFigureSnap.data() as Figure;
      if (existingData.status === 'approved') {
        return { success: false, message: `La figura "${formData.name}" ya existe y está aprobada.` };
      } else if (existingData.status === 'pending_verification') {
        return { success: false, message: `La figura "${formData.name}" ya ha sido propuesta y está pendiente de revisión.` };
      }
    }

    const newFigureData: Figure = {
      id: figureId,
      name: formData.name.trim(),
      nameLower: formData.name.trim().toLowerCase(),
      description: formData.description?.trim() || "",
      photoUrl: PLACEHOLDER_IMAGE_URL,
      nationality: formData.nationality?.trim() || "",
      occupation: formData.occupation?.trim() || "",
      gender: formData.gender?.trim() || "",
      proposedWikiLink: formData.proposedWikiLink.trim(),
      status: 'pending_verification',
      proposedBy: userId,
      createdAt: serverTimestamp() as unknown as string,
      perceptionCounts: { alegria: 0, envidia: 0, tristeza: 0, miedo: 0, desagrado: 0, furia: 0 },
      attitudeCounts: { neutral: 0, fan: 0, simp: 0, hater: 0 },
    };

    await setDoc(figureRef, newFigureData);

    return { success: true, message: "Propuesta enviada exitosamente para revisión.", figureId: figureId };

  } catch (error: any) {
    console.error("Error proposing new figure to Firestore:", error);
    // Check for Firestore specific permission error
    if (error.code === 'permission-denied') {
        return { success: false, message: "Error de Permiso: No tienes permiso para crear esta figura. Por favor, verifica las reglas de seguridad de Firestore en la consola de Firebase."};
    }
    return { success: false, message: error.message || "Ocurrió un error en el servidor al procesar la propuesta." };
  }
}
