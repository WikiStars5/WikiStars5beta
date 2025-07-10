
"use client";

import { useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { auth, db, app as firebaseApp } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// VAPID key for web push notifications, moved to a constant for clarity.
const VAPID_KEY = "BLgyZLePKEpMgnpd_0J9q-wVPR2_qH3gA-z-XikU4y2PjHnEPF2M5f0G4RkG3kZ_6_a2jYp-0t_Z-5C4Z-f9B2c";

// This component is designed to be placed in the main layout.
// It will handle push notification logic in the background AFTER permission is granted.
export function PushNotificationManager() {
  const { toast } = useToast();

  // This effect runs when the component mounts and listens for auth state changes.
  // It's responsible for getting and saving the FCM token if permission is already granted.
  useEffect(() => {
    const setupMessagingForUser = async (user: User | null) => {
      // We need to wait for the service worker to be ready before getting the token
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.serwist !== undefined) {
        try {
          // The service worker is registered by next-pwa. We wait for it to be ready.
          await window.serwist.ready;

          if (Notification.permission !== 'granted') {
            // Do nothing if permissions are not already granted.
            // The user will grant them through the NotificationPrompt or another component.
            return;
          }

          const messaging = getMessaging(firebaseApp);
          const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
          
          if (currentToken && user && !user.isAnonymous) {
            const userDocRef = doc(db, 'registered_users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            // Only update Firestore if the token is new or doesn't exist on the document
            if (!userDocSnap.exists() || userDocSnap.data()?.fcmToken !== currentToken) {
                // Use setDoc with merge:true to create the doc if it doesn't exist, or update it if it does.
                await setDoc(userDocRef, { 
                    fcmToken: currentToken,
                    lastTokenUpdate: serverTimestamp()
                }, { merge: true });
            }
          }

          // Handle foreground messages
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
          if (String(error).includes("token-subscribe-failed")) {
             console.error("Token subscribe failed. This often points to an issue with VAPID key validation or API key restrictions. Double-check your setup in the Google Cloud Console.");
          }
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setupMessagingForUser(user);
    });

    return () => {
        unsubscribe();
    };
  }, [toast]); 

  return null; // This component does not render anything
}
