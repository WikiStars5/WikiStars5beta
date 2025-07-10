
"use client";

import { useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { auth, db, app as firebaseApp } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// This component is designed to be placed in the main layout.
// It will handle all push notification logic in the background.
export function PushNotificationManager() {
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !user.isAnonymous) {
        // User is logged in, initialize messaging
        initializeFirebaseMessaging(user);
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on component mount

  const initializeFirebaseMessaging = async (user: User) => {
    // Ensure this only runs in the browser
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    // Check if permission is already granted
    if (Notification.permission !== 'granted') {
      // Don't proactively ask for permission here.
      // The user will be prompted from the Profile page or InstallPwaButton.
      return;
    }
    
    try {
      const messaging = getMessaging(firebaseApp);

      // Public VAPID key from Firebase project settings
      const VAPID_KEY = "BLgyZLePKEpMgnpd_0J9q-wVPR2_qH3gA-z-XikU4y2PjHnEPF2M5f0G4RkG3kZ_6_a2jYp-0t_Z-5C4Z-f9B2c";

      // Get registration token.
      const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
      
      if (currentToken) {
        // console.log('FCM Token obtained:', currentToken);
        // Save the token to the user's document in Firestore
        const userDocRef = doc(db, 'registered_users', user.uid);
        await updateDoc(userDocRef, { 
            fcmToken: currentToken,
            lastTokenUpdate: serverTimestamp() // Good practice to know when it was last updated
        });
      } else {
        console.warn('No registration token available. Request permission to generate one.');
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
  };

  return null; // This component does not render anything
}
