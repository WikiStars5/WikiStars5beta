
"use client";

import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useAuth } from '@/hooks/useAuth';
import { app, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc } from 'firebase/firestore';

export function PushNotificationManager() {
  const { firebaseUser, isAnonymous } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Only run for authenticated, non-anonymous users
    if (!firebaseUser || isAnonymous) {
      return;
    }

    // This code only runs on the client
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const messaging = getMessaging(app);

      const requestPermissionAndToken = async () => {
        try {
          // This is the corrected VAPID key.
          const currentToken = await getToken(messaging, {
            vapidKey: 'BFJgG3wIOFf5k3z4d6BTVb-B-iLwE0hZ9m_YJq8zG9g8H3fR2k8J5qZ5Z-zYJ8wX5j_H5wJq8zG9g8H3fR2k8J5qZ5Z-zYJ8wX5j_H5w',
          });

          if (currentToken) {
            // Send the token to your server and update the user's profile
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            await setDoc(userDocRef, { fcmToken: currentToken }, { merge: true });
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        } catch (err) {
          console.error('An error occurred while retrieving token. ', err);
          // Optionally show a toast to the user that permission is needed
        }
      };
      
      // Request permission as soon as the component mounts for a logged-in user
      if ('Notification' in window && Notification.permission === 'granted') {
          requestPermissionAndToken();
      }

      // Handle incoming messages when the app is in the foreground
      const unsubscribeOnMessage = onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        toast({
          title: payload.notification?.title || "Nueva Notificación",
          description: payload.notification?.body,
        });
      });

      return () => {
        unsubscribeOnMessage();
      };
    }
  }, [firebaseUser, isAnonymous, toast]);

  // This component does not render anything
  return null;
}
