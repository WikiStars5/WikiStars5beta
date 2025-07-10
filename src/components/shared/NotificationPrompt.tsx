
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BellRing, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getMessaging, getToken } from 'firebase/messaging';
import { app as firebaseApp, auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export function NotificationPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      // Check permission status after a short delay to allow the page to render
      const timer = setTimeout(() => {
        if (Notification.permission === 'default') {
          setIsVisible(true);
        }
      }, 5000); // Show prompt after 5 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  const handleRequestPermission = async () => {
    if (!isSupported) {
      toast({ title: "No Soportado", description: "Tu navegador no soporta notificaciones push.", variant: "destructive" });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setIsVisible(false); // Hide the prompt regardless of the outcome

      if (permission === 'granted') {
        toast({ title: "¡Permiso Concedido!", description: "Todo listo para recibir notificaciones." });
        
        // After getting permission, try to get and save the token for the current user
        const messaging = getMessaging(firebaseApp);
        const VAPID_KEY = "BLgyZLePKEpMgnpd_0J9q-wVPR2_qH3gA-z-XikU4y2PjHnEPF2M5f0G4RkG3kZ_6_a2jYp-0t_Z-5C4Z-f9B2c";
        const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
        
        const currentUser = auth.currentUser;
        if (currentToken && currentUser && !currentUser.isAnonymous) {
            const userDocRef = doc(db, 'registered_users', currentUser.uid);
            await updateDoc(userDocRef, { 
                fcmToken: currentToken,
                lastTokenUpdate: serverTimestamp()
            }, { merge: true });
        }
      } else {
        toast({ title: "Permiso Denegado", description: "Has bloqueado las notificaciones. Puedes activarlas en la configuración del navegador.", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error durante la solicitud de permiso:', error);
      toast({ title: "Error Inesperado", description: "Ocurrió un error al intentar activar las notificaciones.", variant: "destructive" });
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-full max-w-sm">
      <div className="bg-card text-card-foreground p-4 rounded-lg shadow-2xl border border-border animate-in slide-in-from-bottom-5 fade-in-50">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 p-2 rounded-full">
            <BellRing className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold">Activar Notificaciones</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Recibe alertas sobre respuestas y 'me gusta' incluso cuando no estés en la web.
            </p>
            <div className="flex gap-2 mt-3">
              <Button onClick={handleRequestPermission} className="flex-1">Permitir</Button>
              <Button onClick={() => setIsVisible(false)} variant="secondary" className="flex-1">Ahora no</Button>
            </div>
          </div>
           <button onClick={() => setIsVisible(false)} className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4"/>
           </button>
        </div>
      </div>
    </div>
  );
}
