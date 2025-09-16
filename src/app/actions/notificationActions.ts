
"use server";

import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';

export async function markNotificationAsRead(notificationId: string, userId: string): Promise<{ success: boolean; message?: string }> {
  if (!userId) return { success: false, message: 'Usuario no autenticado.' };
  if (!notificationId) return { success: false, message: 'ID de notificación no proporcionado.' };
  
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    
    // The security rule will validate that the userId matches the authenticated user.
    // This ensures a user cannot mark another user's notifications as read.
    await updateDoc(notificationRef, { 
      isRead: true,
      userId: userId, // Ensure userId is part of the update for security rule validation
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error marcando notificación como leída:', error);
    return { success: false, message: `No se pudo marcar la notificación como leída. Error: ${error.message}` };
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<{ success: boolean; message?: string }> {
  if (!userId) return { success: false, message: 'ID de usuario no proporcionado.' };
  
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', userId), where('isRead', '==', false));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: true, message: "No hay notificaciones para marcar." };
    }

    const batch = writeBatch(db);
    querySnapshot.forEach(doc => {
      // The security rule will still verify that the userId matches the authenticated user's UID.
      batch.update(doc.ref, { 
        isRead: true,
      });
    });

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error('Error marcando todas las notificaciones como leídas:', error);
    return { success: false, message: `Ocurrió un error al marcar todo como leído: ${error.message}` };
  }
}

