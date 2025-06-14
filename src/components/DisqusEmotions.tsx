
"use client";

import React, { useEffect } from 'react';

// Define la interfaz para las propiedades que el componente DisqusEmotions recibirá
interface DisqusEmotionsProps {
  pageUrl: string;   // La URL canónica de la página actual para este hilo
  pageIdentifier: string; // Un identificador único para este hilo de emociones
  pageTitle: string; // El título de la página para este hilo de emociones
}

/**
 * Componente React para integrar el widget de Disqus específico para Reacciones Emocionales.
 * Carga su propio script de Disqus para el shortname 'wikistars5emociones'.
 */
const DisqusEmotions: React.FC<DisqusEmotionsProps> = ({ pageUrl, pageIdentifier, pageTitle }) => {
  const DISQUS_EMOTIONS_SHORTNAME = 'wikistars5emociones';
  const emotionsScriptId = 'dsq-emotions-script'; // Unique ID for this component's script
  const disqusContainerId = 'disqus_emotions_thread'; // The ID of the div this component renders

  useEffect(() => {
    // 1. Set the global Disqus configuration for this specific instance.
    //    The embed.js script will pick this up when it loads.
    (window as any).disqus_config = function (this: any) {
      this.page.url = pageUrl;
      this.page.identifier = pageIdentifier;
      this.page.title = pageTitle;
    };

    // 2. Remove any old script for this component to ensure a fresh load.
    const oldScript = document.getElementById(emotionsScriptId);
    if (oldScript && oldScript.parentNode) {
      oldScript.parentNode.removeChild(oldScript);
    }

    // 3. Clear the target container's content (where Disqus will render).
    //    This is important if the component re-renders or properties change.
    const container = document.getElementById(disqusContainerId);
    if (container) {
      // container.innerHTML = ''; // Let Disqus script handle the "loading..." message
    } else {
      console.warn(`DisqusEmotions: Container div con id '${disqusContainerId}' no encontrado. Disqus no cargará.`);
      return; // Stop if the target div isn't found
    }

    // 4. Create and append the new script for this specific shortname.
    const script = document.createElement('script');
    script.id = emotionsScriptId;
    script.src = `https://${DISQUS_EMOTIONS_SHORTNAME}.disqus.com/embed.js`;
    script.setAttribute('data-timestamp', String(+new Date()));
    script.async = true;
    
    if (document.body) {
      document.body.appendChild(script);
    } else {
      console.error("DisqusEmotions: document.body es null, no se puede añadir el script de Disqus.");
      return;
    }

    // 5. Cleanup function when the component unmounts or dependencies change.
    return () => {
      const currentScript = document.getElementById(emotionsScriptId);
      if (currentScript && currentScript.parentNode) {
        currentScript.parentNode.removeChild(currentScript);
      }
      
      // It's generally unsafe to delete window.disqus_config if another Disqus widget might be active
      // or re-rendering, as it's a shared global.
      // delete (window as any).disqus_config;

      const disqusContainer = document.getElementById(disqusContainerId);
      if (disqusContainer) {
        disqusContainer.innerHTML = ''; // Clear content on unmount
      }
    };
  }, [pageUrl, pageIdentifier, pageTitle, DISQUS_EMOTIONS_SHORTNAME]); // Dependencies for the effect

  return (
    // This div is where this instance of Disqus will render its content.
    <div id={disqusContainerId} className="mt-8 p-4 bg-card rounded-lg shadow-inner">
      <h2 className="text-2xl font-semibold text-card-foreground mb-4">Reacciones Emocionales</h2>
      <p className="text-sm text-muted-foreground">
        Cargando reacciones emocionales... (Gestionado por Disqus con el shortname '{DISQUS_EMOTIONS_SHORTNAME}')
      </p>
      {/* 
        Nota para el desarrollador:
        Asegúrate de que el sitio 'wikistars5emociones' esté configurado en Disqus para mostrar
        solo las reacciones (emojis) y, si es posible, ocultar el campo de comentario principal
        a través de la configuración de Disqus o CSS personalizado si Disqus lo permite para
        su widget de reacciones.
      */}
    </div>
  );
};

export default DisqusEmotions;
