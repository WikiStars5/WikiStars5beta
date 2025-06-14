
"use client";

import React, { useEffect } from 'react';

interface DisqusEmotionsProps {
  pageUrl: string;
  pageIdentifier: string;
  pageTitle: string;
}

const DisqusEmotions: React.FC<DisqusEmotionsProps> = ({ pageUrl, pageIdentifier, pageTitle }) => {
  const DISQUS_EMOTIONS_SHORTNAME = 'wikistars5emociones';
  const emotionsScriptId = 'dsq-emotions-script';
  const disqusContainerId = 'disqus_emociones_thread';

  useEffect(() => {
    (window as any).disqus_config = function (this: any) {
      this.page.url = pageUrl;
      this.page.identifier = pageIdentifier;
      this.page.title = pageTitle;
    };

    const oldScript = document.getElementById(emotionsScriptId);
    if (oldScript && oldScript.parentNode) {
      oldScript.parentNode.removeChild(oldScript);
    }

    const container = document.getElementById(disqusContainerId);
    if (container) {
      // container.innerHTML = ''; // Let Disqus script handle the "loading..." message
    } else {
      console.warn(`DisqusEmotions: Container div con id '${disqusContainerId}' no encontrado. Disqus no cargará.`);
      return;
    }

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

    return () => {
      const currentScript = document.getElementById(emotionsScriptId);
      if (currentScript && currentScript.parentNode) {
        currentScript.parentNode.removeChild(currentScript);
      }
      // DO NOT delete window.disqus_config
      
      const disqusContainer = document.getElementById(disqusContainerId);
      if (disqusContainer) {
        disqusContainer.innerHTML = ''; 
      }
    };
  }, [pageUrl, pageIdentifier, pageTitle]);

  return (
    <div id={disqusContainerId} className="mt-8 p-4 bg-card rounded-lg shadow-inner">
      <h2 className="text-2xl font-semibold text-card-foreground mb-4">Reacciones Emocionales</h2>
      <p className="text-sm text-muted-foreground">
        Cargando reacciones emocionales... (Gestionado por Disqus con el shortname '{DISQUS_EMOTIONS_SHORTNAME}')
      </p>
    </div>
  );
};

export default DisqusEmotions;
