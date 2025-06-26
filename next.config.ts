
import type {NextConfig} from 'next'; 

const nextConfig: NextConfig = { 
  /* config options here */ 
  typescript: { 
    // Ignora los errores de construcción de TypeScript. Útil para entornos de desarrollo.
    ignoreBuildErrors: true, 
  }, 
  eslint: { 
    // Ignora los errores de ESLint durante el proceso de construcción.
    ignoreDuringBuilds: true, 
  }, 
  images: { 
    // Configuración para permitir la carga de imágenes desde dominios remotos específicos.
    remotePatterns: [ 
      { 
        protocol: 'https', 
        hostname: 'placehold.co', 
        port: '', 
        pathname: '/**', 
      }, 
      { 
        protocol: 'https', 
        hostname: 'firebasestorage.googleapis.com', 
        port: '', 
        pathname: '/**', 
      }, 
      { 
        protocol: 'https', 
        hostname: '*.wikimedia.org', // Corregido: comodín para CUALQUIER subdominio de wikimedia.org
        port: '', 
        pathname: '/**', 
      }, 
      { 
        protocol: 'https', 
        hostname: 'static.wikia.nocookie.net', // Dominio para Wikia/Fandom 
        port: '', 
        // Permite cualquier ruta de imagen bajo este hostname.
        pathname: '/**', 
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
        port: '',
        pathname: '/**',
      },
    ], 
  }, 
  devIndicators: { 
    // Orígenes permitidos para los indicadores de desarrollo de Next.js.
    allowedDevOrigins: [ 
      'https://9000-firebase-studio-1749775328349.cluster-vpxjqdstfzgs6qeiaf7rdlsqrc.cloudworkstations.dev', 
      'https://6000-firebase-studio-1749775328349.cluster-vpxjqdstfzgs6qeiaf7rdlsqrc.cloudworkstations.dev', 
    ], 
  }, 
}; 

export default nextConfig;
