
"use server";

import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { auth } from '@/lib/firebase';

export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; message?: string }> {
  const currentUser = auth.currentUser;
  if (!currentUser) return { success: false, message: 'Usuario no autenticado.' };
  if (!notificationId) return { success: false, message: 'ID de notificación no proporcionado.' };
  
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    
    // Al actualizar, incluimos el userId para que las reglas de seguridad puedan validarlo.
    // La regla `allow update: if request.auth.uid == request.resource.data.userId;`
    // ahora tendrá acceso a este campo en `request.resource.data`.
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
      // También incluimos el userId en la actualización por lotes.
      batch.update(doc.ref, { 
        isRead: true,
        userId: userId
      });
    });

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error('Error marcando todas las notificaciones como leídas:', error);
    return { success: false, message: `Ocurrió un error al marcar todo como leído: ${error.message}` };
  }
}
