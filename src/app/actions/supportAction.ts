'use server';

// This file and the "support" feature have been removed to resolve persistent errors.
// It can be safely deleted.

export async function toggleFigureSupport(
  figureId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  console.warn(
    'toggleFigureSupport is deprecated and should not be called. The support feature has been removed.'
  );
  return {
    success: false,
    message: 'The support feature has been removed.',
  };
}
