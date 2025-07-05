'use server';

import { db } from '@/lib/firebase';
import { collection, doc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';

export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
  if (!notificationId) return { success: false };
  const notificationRef = doc(db, 'notifications', notificationId);
  try {
    await updateDoc(notificationRef, { isRead: true });
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false };
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<{ success: boolean }> {
  if (!userId) return { success: false };
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
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false };
  }
}
