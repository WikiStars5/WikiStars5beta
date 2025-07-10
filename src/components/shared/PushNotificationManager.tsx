
"use client";

import { useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { auth, db, app as firebaseApp } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// This component is designed to be placed in the main layout.
// It will handle all push notification logic in the background.
export function PushNotificationManager() {
  const { toast } = useToast();

  // Effect to handle Firebase messaging initialization for ANY user (anonymous or registered)
  useEffect(() => {
    // This function will run once the component mounts.
    // It's designed to be called for any visitor.
    const initializeFirebaseMessaging = async (user: User | null) => {
      // Ensure this only runs in the browser and Notification API is available
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return;
      }

      // We don't want to spam users with permission requests.
      // We only ask if the permission state is 'default'.
      if (Notification.permission === 'default') {
        try {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            // User did not grant permission. We can optionally show a soft toast.
            // console.log('Notification permission was not granted.');
            return; // Stop here if permission is not granted.
          }
        } catch (error) {
          console.error('Error requesting notification permission:', error);
          return; // Stop on error
        }
      }

      // If permission is granted, proceed to get the token.
      if (Notification.permission === 'granted') {
        try {
          const messaging = getMessaging(firebaseApp);
          const VAPID_KEY = "BLgyZLePKEpMgnpd_0J9q-wVPR2_qH3gA-z-XikU4y2PjHnEPF2M5f0G4RkG3kZ_6_a2jYp-0t_Z-5C4Z-f9B2c";
          const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
          
          // IMPORTANT: Only try to save the token if we have a REGISTERED user.
          if (currentToken && user && !user.isAnonymous) {
            const userDocRef = doc(db, 'registered_users', user.uid);
            // Check if token needs to be updated to avoid unnecessary writes
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists() || userDocSnap.data()?.fcmToken !== currentToken) {
                await updateDoc(userDocRef, { 
                    fcmToken: currentToken,
                    lastTokenUpdate: serverTimestamp()
                });
            }
          }

          // Handle incoming messages while the app is in the foreground
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
      }
    };

    // We use a small timeout to let the page load before asking for permission.
    // This improves user experience.
    const timer = setTimeout(() => {
        const user = auth.currentUser;
        initializeFirebaseMessaging(user);
    }, 5000); // Wait 5 seconds after component mounts

    // We still listen to auth state changes to update the token for a user who logs in.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !user.isAnonymous) {
        // A registered user has logged in, re-run the logic to ensure their token is saved.
        initializeFirebaseMessaging(user);
      }
    });

    return () => {
        clearTimeout(timer);
        unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on component mount

  return null; // This component does not render anything
}
