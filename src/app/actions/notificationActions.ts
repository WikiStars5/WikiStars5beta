
"use server";

import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { auth } from '@/lib/firebase';

export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; message?: string }> {
  // We can't easily pass the UID here without a bigger refactor of the on-click event.
  // Instead, we rely on the security rule and the fact that this is called after auth state is likely stable.
  // The primary fix is for markAllNotificationsAsRead.
  const currentUser = auth.currentUser;
  if (!currentUser) return { success: false, message: 'Usuario no autenticado.' };
  if (!notificationId) return { success: false, message: 'ID de notificación no proporcionado.' };
  
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    
    await updateDoc(notificationRef, { 
      isRead: true,
      userId: currentUser.uid 
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
