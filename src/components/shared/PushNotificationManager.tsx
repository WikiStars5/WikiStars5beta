
"use client";

import { useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { auth, db, app as firebaseApp } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// This component is designed to be placed in the main layout.
// It will handle push notification logic in the background AFTER permission is granted.
export function PushNotificationManager() {
  const { toast } = useToast();

  // This effect runs when the component mounts and listens for auth state changes.
  // It's responsible for getting and saving the FCM token if permission is already granted.
  useEffect(() => {
    const setupMessagingForUser = async (user: User | null) => {
      if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
        // Do nothing if permissions are not already granted.
        // The user will grant them through the NotificationPrompt component.
        return;
      }

      try {
        const messaging = getMessaging(firebaseApp);
        const VAPID_KEY = "BLgyZLePKEpMgnpd_0J9q-wVPR2_qH3gA-z-XikU4y2PjHnEPF2M5f0G4RkG3kZ_6_a2jYp-0t_Z-5C4Z-f9B2c";
        const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
        
        if (currentToken && user && !user.isAnonymous) {
          const userDocRef = doc(db, 'registered_users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (!userDocSnap.exists() || userDocSnap.data()?.fcmToken !== currentToken) {
              await updateDoc(userDocRef, { 
                  fcmToken: currentToken,
                  lastTokenUpdate: serverTimestamp()
              }, { merge: true });
          }
        }

        onMessage(messaging, (payload) => {
          console.log('Message received while app is in foreground: ', payload);
          if (payload.notification) {
            toast({
              title: payload.notification.title,
              description: payload.notification.body,
            });
          }
        });

      } catch (error) {
        console.error('An error occurred while retrieving token or setting up messaging.', error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Setup messaging for the current user (registered or null)
      setupMessagingForUser(user);
    });

    return () => {
        unsubscribe();
    };
  }, [toast]); 

  return null; // This component does not render anything
}
