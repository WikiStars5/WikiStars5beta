
"use client";

import React, { useEffect } from 'react';

interface DisqusCommentsProps {
  pageUrl: string;
  pageIdentifier: string;
  pageTitle: string;
}

const DisqusComments: React.FC<DisqusCommentsProps> = ({ pageUrl, pageIdentifier, pageTitle }) => {
  const DISQUS_SHORTNAME = 'wikistars5';
  const commentsScriptId = 'dsq-comments-script'; // Unique ID for this component's script
  const disqusContainerId = 'disqus_thread'; // Standard Disqus container ID

  useEffect(() => {
    (window as any).disqus_config = function (this: any) {
      this.page.url = pageUrl;
      this.page.identifier = pageIdentifier;
      this.page.title = pageTitle;
    };

    // Remove any old script for this component
    const oldScript = document.getElementById(commentsScriptId);
    if (oldScript && oldScript.parentNode) {
      oldScript.parentNode.removeChild(oldScript);
    }
    
    // Clear the container in case of re-renders before script load
    const container = document.getElementById(disqusContainerId);
    if (container) {
      // container.innerHTML = ''; // Disqus script should handle the "loading..." message
    }


    const script = document.createElement('script');
    script.id = commentsScriptId;
    script.src = `https://${DISQUS_SHORTNAME}.disqus.com/embed.js`;
    script.setAttribute('data-timestamp', String(+new Date()));
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const currentScript = document.getElementById(commentsScriptId);
      if (currentScript && currentScript.parentNode) {
        currentScript.parentNode.removeChild(currentScript);
      }
      // DO NOT delete window.disqus_config as it might be needed by the other Disqus instance.
      // delete (window as any).disqus_config; 
      
      const disqusContainer = document.getElementById(disqusContainerId);
      if (disqusContainer) {
        disqusContainer.innerHTML = ''; // Clear content on unmount
      }
    };
  }, [pageUrl, pageIdentifier, pageTitle]);

  return (
    <div id={disqusContainerId} className="mt-8 p-4 bg-card rounded-lg shadow-inner">
      <h2 className="text-2xl font-semibold text-card-foreground mb-4">Comentarios</h2>
      <p className="text-sm text-muted-foreground">Cargando comentarios...</p>
    </div>
  );
};

export default DisqusComments;
