
'use server';

import { enrichFigureInfo, type EnrichFigureInfoInput } from '@/ai/flows/enrich-figure-info-flow';
import { updateFigureInFirestore, getFigureFromFirestore } from '@/lib/placeholder-data';
import type { Figure } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function enrichAndSaveFigureData(
    figureId: string,
    figureName: string,
    currentData: {
        description?: string;
        nationality?: string;
        occupation?: string;
        gender?: string;
    }
): Promise<{ success: boolean; message: string; updatedFigure?: Figure }> {
  try {
    const input: EnrichFigureInfoInput = {
      figureName,
      currentDescription: currentData.description,
      currentNationality: currentData.nationality,
      currentOccupation: currentData.occupation,
      currentGender: currentData.gender,
    };

    const enrichedData = await enrichFigureInfo(input);

    const existingFigure = await getFigureFromFirestore(figureId);
    if (!existingFigure) {
      return { success: false, message: 'Figure not found in Firestore.' };
    }

    // Merge enriched data with existing data, prioritizing enriched data if present
    const figureToUpdate: Figure = {
      ...existingFigure,
      description: enrichedData.description?.trim() || existingFigure.description,
      nationality: enrichedData.nationality?.trim() || existingFigure.nationality,
      occupation: enrichedData.occupation?.trim() || existingFigure.occupation,
      gender: enrichedData.gender?.trim() || existingFigure.gender,
    };
    
    // Ensure nameLower is preserved/updated
    figureToUpdate.nameLower = figureToUpdate.name.toLowerCase();


    await updateFigureInFirestore(figureToUpdate);
    
    revalidatePath(`/figures/${figureId}`);
    revalidatePath(`/admin/figures/${figureId}/edit`);

    return { success: true, message: 'Figure information enriched and saved successfully.', updatedFigure: figureToUpdate };
  } catch (error: any) {
    console.error('Error enriching figure data:', error);
    let errorMessage = 'Failed to enrich figure data.';
    if (error.message) {
        errorMessage += ` Details: ${error.message}`;
    }
    return { success: false, message: errorMessage };
  }
}
