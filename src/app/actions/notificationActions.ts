import { db } from '@/lib/firebase';
import { collection, doc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';

export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; message?: string }> {
  if (!notificationId) return { success: false, message: 'ID de notificación no proporcionado.' };
  const notificationRef = doc(db, 'notifications', notificationId);
  try {
    await updateDoc(notificationRef, { isRead: true });
    return { success: true };
  } catch (error: any) {
    console.error('Error marcando notificación como leída:', error);
    if (error.code === 'permission-denied') {
      return { success: false, message: 'Error de permisos. Asegúrate de que las Reglas de Seguridad de Firestore estén actualizadas y publicadas correctamente.' };
    }
    return { success: false, message: `No se pudo marcar la notificación como leída. Inténtalo de nuevo.` };
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<{ success: boolean; message?: string }> {
  if (!userId) return { success: false, message: 'ID de usuario no proporcionado.' };
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', userId), where('isRead', '==', false));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: true }; // Nothing to mark
    }

    const batch = writeBatch(db);
    querySnapshot.forEach(doc => {
      batch.update(doc.ref, { isRead: true });
    });

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error('Error marcando todas las notificaciones como leídas:', error);
    if (error.code === 'permission-denied') {
      return { success: false, message: 'Error de permisos. No se pudo actualizar una o más notificaciones. Asegúrate de que las reglas de Firestore están actualizadas.' };
    }
    return { success: false, message: `Ocurrió un error al marcar todo como leído: ${error.message}` };
  }
}
