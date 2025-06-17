
'use server';

import { enrichFigureInfo, type EnrichFigureInfoInput } from '@/ai/flows/enrich-figure-info-flow';
import { updateFigureInFirestore, getFigureFromFirestore } from '@/lib/placeholder-data';
import type { Figure } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function enrichAndSaveFigureData(
    figureId: string,
    figureName: string,
    currentData: Partial<Pick<Figure, 
      'description' | 'nationality' | 'occupation' | 'gender' |
      'alias' | 'species' | 'firstAppearance' | 'birthDateOrAge' | 'birthPlace' | 
      'statusLiveOrDead' | 'maritalStatus' | 'height' | 'weight' | 
      'hairColor' | 'eyeColor' | 'distinctiveFeatures'
    >>
): Promise<{ success: boolean; message: string; updatedFigure?: Figure }> {
  try {
    const input: EnrichFigureInfoInput = {
      figureName,
      currentDescription: currentData.description,
      currentNationality: currentData.nationality,
      currentOccupation: currentData.occupation,
      currentGender: currentData.gender,
      currentAlias: currentData.alias,
      currentSpecies: currentData.species,
      currentFirstAppearance: currentData.firstAppearance,
      currentBirthDateOrAge: currentData.birthDateOrAge,
      currentBirthPlace: currentData.birthPlace,
      currentStatusLiveOrDead: currentData.statusLiveOrDead,
      currentMaritalStatus: currentData.maritalStatus,
      currentHeight: currentData.height,
      currentWeight: currentData.weight,
      currentHairColor: currentData.hairColor,
      currentEyeColor: currentData.eyeColor,
      currentDistinctiveFeatures: currentData.distinctiveFeatures,
    };

    const enrichedData = await enrichFigureInfo(input);

    const existingFigure = await getFigureFromFirestore(figureId);
    if (!existingFigure) {
      return { success: false, message: 'Figure not found in Firestore.' };
    }

    const figureToUpdate: Partial<Figure> & {id: string} = {
      id: existingFigure.id,
      name: existingFigure.name, // Preserve original name
      nameLower: existingFigure.name.toLowerCase(),

      description: enrichedData.description?.trim() || existingFigure.description,
      nationality: enrichedData.nationality?.trim() || existingFigure.nationality,
      occupation: enrichedData.occupation?.trim() || existingFigure.occupation,
      gender: enrichedData.gender?.trim() || existingFigure.gender,
      alias: enrichedData.alias?.trim() || existingFigure.alias,
      species: enrichedData.species?.trim() || existingFigure.species,
      firstAppearance: enrichedData.firstAppearance?.trim() || existingFigure.firstAppearance,
      birthDateOrAge: enrichedData.birthDateOrAge?.trim() || existingFigure.birthDateOrAge,
      birthPlace: enrichedData.birthPlace?.trim() || existingFigure.birthPlace,
      statusLiveOrDead: enrichedData.statusLiveOrDead?.trim() || existingFigure.statusLiveOrDead,
      maritalStatus: enrichedData.maritalStatus?.trim() || existingFigure.maritalStatus,
      height: enrichedData.height?.trim() || existingFigure.height,
      weight: enrichedData.weight?.trim() || existingFigure.weight,
      hairColor: enrichedData.hairColor?.trim() || existingFigure.hairColor,
      eyeColor: enrichedData.eyeColor?.trim() || existingFigure.eyeColor,
      distinctiveFeatures: enrichedData.distinctiveFeatures?.trim() || existingFigure.distinctiveFeatures,
    };
    
    await updateFigureInFirestore(figureToUpdate);
    
    revalidatePath(`/figures/${figureId}`);
    revalidatePath(`/admin/figures/${figureId}/edit`); 
    revalidatePath(`/figures`);
    revalidatePath(`/admin/figures`);

    const finalUpdatedFigure = await getFigureFromFirestore(figureId);

    return { success: true, message: 'Figure information enriched and saved successfully.', updatedFigure: finalUpdatedFigure };
  } catch (error: any) {
    console.error('Error enriching figure data:', error);
    let errorMessage = 'Failed to enrich figure data.';
    if (error.message) {
        errorMessage += ` Details: ${error.message}`;
    }
    return { success: false, message: errorMessage };
  }
}

