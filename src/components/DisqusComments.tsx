"use client";

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation'; // Hook de Next.js para obtener la ruta actual

// Define la interfaz para las propiedades que el componente DisqusComments recibirá
interface DisqusCommentsProps {
  // shortname: string; // ¡Ya no lo pasamos como prop, lo hardcodeamos aquí ya que lo conocemos!
  pageUrl: string;   // La URL canónica de la página actual (ej: 'https://tuapp.com/figures/figura-id')
  pageIdentifier: string; // Un identificador único para esta página (ej: 'figura-id')
  pageTitle: string; // El título de la página (opcional, pero útil para Disqus)
}

/**
 * Componente React para integrar los comentarios de Disqus.
 * Utiliza useEffect para cargar el script de Disqus dinámicamente.
 */
const DisqusComments: React.FC<DisqusCommentsProps> = ({ pageUrl, pageIdentifier, pageTitle }) => {
  // Tu shortname de Disqus, hardcodeado ya que lo obtuvimos del código embed:
  const DISQUS_SHORTNAME = 'wikistars5'; 

  // Puedes obtener la URL de la página actual de forma dinámica si es necesario
  // const pathname = usePathname();
  // const currentPageUrl = typeof window !== 'undefined' ? `${window.location.origin}${pathname}` : pageUrl;

  useEffect(() => {
    // Estas variables de configuración son necesarias para que Disqus identifique el hilo correcto.
    // Se asignan a window.disqus_config para que el script de Disqus pueda acceder a ellas.
    (window as any).disqus_config = function (this: any) {
      this.page.url = pageUrl;
      this.page.identifier = pageIdentifier;
      this.page.title = pageTitle;
      // Puedes añadir otras variables de configuración de Disqus aquí si las necesitas
      // this.page.url = PAGE_URL;
      // this.page.identifier = PAGE_IDENTIFIER;
    };

    // Crea y añade el script de Disqus al DOM
    const script = document.createElement('script');
    script.src = `https://${DISQUS_SHORTNAME}.disqus.com/embed.js`;
    script.setAttribute('data-timestamp', String(+new Date())); // Previene el cacheo del script
    script.async = true; // Carga el script de forma asíncrona para no bloquear el renderizado
    document.body.appendChild(script);

    // Función de limpieza para cuando el componente se desmonte
    return () => {
      // Elimina el script de Disqus si el componente se desmonta
      const disqusScript = document.querySelector(`script[src^="https://${DISQUS_SHORTNAME}.disqus.com/embed.js"]`);
      if (disqusScript) {
        document.body.removeChild(disqusScript);
      }
      // Limpia la configuración global de Disqus para evitar conflictos
      delete (window as any).disqus_config;
      // También elimina otros elementos que Disqus pueda añadir si persisten
      const disqusContainer = document.getElementById('disqus_thread');
      if (disqusContainer) {
        disqusContainer.innerHTML = ''; // Limpia el contenido del div
      }
    };
  }, [pageUrl, pageIdentifier, pageTitle]); // Dependencias: recarga el script si cambian estas propiedades

  return (
    <div id="disqus_thread" className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-inner">
      {/* Este div es donde Disqus incrustará su contenido */}
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Comentarios</h2>
      <p className="text-gray-600 dark:text-gray-400">Cargando comentarios...</p>
    </div>
  );
};

export default DisqusComments;
