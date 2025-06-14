
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
 * Utiliza useEffect para cargar el script de Disqus dinámicamente, asegurando un manejo correcto del DOM.
 */
const DisqusEmotions: React.FC<DisqusEmotionsProps> = ({ pageUrl, pageIdentifier, pageTitle }) => {
  // Tu shortname específico para el foro de emociones de Disqus
  const DISQUS_EMOTIONS_SHORTNAME = 'wikistars5emociones'; 

  useEffect(() => {
    // Estas variables de configuración son necesarias para que Disqus identifique el hilo correcto.
    // Se asignan a window.disqus_config para que el script de Disqus pueda acceder a ellas.
    (window as any).disqus_config = function (this: any) {
      this.page.url = pageUrl;
      this.page.identifier = pageIdentifier;
      this.page.title = pageTitle;
      // Puedes añadir otras variables de configuración específicas de Disqus para reacciones aquí si es necesario
      // Por ejemplo, para configurar reacciones específicas si tu shortname lo permite
    };

    // Asegúrate de que el elemento 'disqus_thread' exista en el DOM antes de intentar cargar el script.
    // También, si ya existe un script de Disqus para este ID, evitamos cargarlo de nuevo.
    if (!document.getElementById('disqus_emotions_thread')) {
      const script = document.createElement('script');
      script.id = 'dsq-emotions-script'; // Asigna un ID único al script para fácil remoción
      script.src = `https://${DISQUS_EMOTIONS_SHORTNAME}.disqus.com/embed.js`;
      script.setAttribute('data-timestamp', String(+new Date()));
      script.async = true; 
      // Añadimos el script al cuerpo del documento
      document.body.appendChild(script);
    } else {
      // Si el div ya existe, podemos intentar resetear Disqus para recargar el hilo
      if (typeof (window as any).DISQUS !== 'undefined') {
        (window as any).DISQUS.reset({
          reload: true,
          config: (function (this: any) {
            this.page.url = pageUrl;
            this.page.identifier = pageIdentifier;
            this.page.title = pageTitle;
          })
        });
      }
    }


    // Función de limpieza para cuando el componente se desmonte
    return () => {
      // Elimina el script de Disqus y limpia la configuración global para evitar conflictos
      const disqusScript = document.getElementById('dsq-emotions-script');
      if (disqusScript) {
        document.body.removeChild(disqusScript);
      }
      delete (window as any).disqus_config;

      // También limpia el contenido del div de Disqus para una recarga limpia
      const disqusContainer = document.getElementById('disqus_emotions_thread');
      if (disqusContainer) {
        disqusContainer.innerHTML = ''; 
      }
    };
  }, [pageUrl, pageIdentifier, pageTitle]); // Dependencias: recarga el script si cambian estas propiedades

  return (
    // Es CRÍTICO que este div tenga el mismo ID que el que Disqus busca ('disqus_thread')
    // para su carga estándar. Sin embargo, para múltiples instancias, a veces Disqus
    // usa el ID que se le pasa en el script si es diferente.
    // Usaremos un ID único para este div para evitar conflictos con el Disqus principal.
    <div id="disqus_emotions_thread" className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-inner">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Reacciones Emocionales</h2>
      <p className="text-gray-600 dark:text-gray-400">Cargando reacciones emocionales...</p>
      {/* El contenido de Disqus se incrustará aquí */}
    </div>
  );
};

export default DisqusEmotions;
