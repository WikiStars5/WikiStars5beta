'use server';

// This file is no longer needed after removing the AI functionality and can be safely deleted.
// The function is provided to prevent build errors from components that still import it.
export async function enrichAndSaveFigureData(
  figureId: string,
  name: string,
  data: any
): Promise<{ success: boolean; message: string }> {
  console.warn('enrichAndSaveFigureData is deprecated and should not be called.');
  return {
    success: false,
    message: 'AI functionality has been removed.',
  };
}
