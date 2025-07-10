
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BellRing, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function NotificationPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // This effect runs only once on the client to check for notification support
    // and decide if the prompt should be shown after a delay.
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      const timer = setTimeout(() => {
        // Show the prompt only if the user hasn't made a decision yet.
        if (Notification.permission === 'default') {
          setIsVisible(true);
        }
      }, 5000); // 5-second delay

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
        toast({
          title: "¡Permisos Concedidos!",
          description: "¡Todo listo! El sistema registrará tu dispositivo para recibir notificaciones."
        });
        // The PushNotificationManager will now automatically handle getting and saving the token.
      } else {
        toast({
          title: "Permisos Denegados",
          description: "No podrás recibir notificaciones. Puedes cambiarlas en la configuración de tu navegador.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error durante la solicitud de permiso de notificación:', error);
      toast({
        title: "Error Inesperado",
        description: "Ocurrió un error al intentar activar las notificaciones.",
        variant: "destructive"
      });
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
             <X className="h-4 w-4" />
           </button>
        </div>
      </div>
    </div>
  );
}
