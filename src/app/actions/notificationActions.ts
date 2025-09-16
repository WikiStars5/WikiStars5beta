
"use server";

// This file is being refactored. The logic for marking notifications
// as read has been moved to onCall Cloud Functions ('markNotificationAsRead' and 'markAllNotificationsAsRead')
// in `functions/src/index.ts`. This resolves persistent permission issues by ensuring
// the user's authentication context is correctly handled on the backend.

import { callFirebaseFunction } from '@/lib/firebase';

export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const result = await callFirebaseFunction('markNotificationAsRead', { notificationId });
    if (result.success) {
      return { success: true };
    } else {
      // Propagate the error message from the cloud function
      return { success: false, message: result.message || 'La función en la nube falló sin un mensaje.' };
    }
  } catch (error: any) {
    console.error('Error llamando a la función markNotificationAsRead:', error);
    // The error from a cloud function call might have a 'details' property
    const message = error.details?.message || error.message || 'No se pudo conectar con la función en la nube.';
    return { success: false, message };
  }
}


export async function markAllNotificationsAsRead(userId: string): Promise<{ success: boolean; message?: string }> {
   try {
    // The userId is automatically available in the onCall function's context, so we don't need to pass it.
    const result = await callFirebaseFunction('markAllNotificationsAsRead');
    if (result.success) {
      return { success: true, message: result.message };
    } else {
      return { success: false, message: result.message || 'La función en la nube para marcar todo como leído falló.' };
    }
  } catch (error: any) {
    console.error('Error llamando a la función markAllNotificationsAsRead:', error);
    const message = error.details?.message || error.message || 'No se pudo conectar con la función en la nube.';
    return { success: false, message };
  }
}
