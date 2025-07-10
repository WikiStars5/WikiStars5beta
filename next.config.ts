
import type {NextConfig} from 'next'; 

// Correctly import the withPWA plugin.
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // By injecting the Firebase script into the PWA's service worker,
  // we ensure both functionalities coexist without conflict.
  // This is the standard and recommended approach to fix messaging registration errors.
  swSrc: 'service-worker.js', 
});

const nextConfig: NextConfig = { 
  /* config options here */ 
  typescript: { 
    ignoreBuildErrors: true, 
  }, 
  eslint: { 
    ignoreDuringBuilds: true, 
  }, 
  images: { 
    remotePatterns: [ 
      { protocol: 'https', hostname: 'placehold.co', port: '', pathname: '/**', }, 
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com', port: '', pathname: '/**', }, 
      { protocol: 'https', hostname: '**.wikimedia.org', port: '', pathname: '/**', }, 
      { protocol: 'https', hostname: 'static.wikia.nocookie.net', port: '', pathname: '/**', },
      { protocol: 'https', hostname: '**.pinimg.com', port: '', pathname: '/**', },
      { protocol: 'https', hostname: 'flagcdn.com', port: '', pathname: '/**', },
    ], 
  }, 
  devIndicators: { 
    allowedDevOrigins: [ 
      'https://9000-firebase-studio-1749775328349.cluster-vpxjqdstfzgs6qeiaf7rdlsqrc.cloudworkstations.dev', 
      'https://6000-firebase-studio-1749775328349.cluster-vpxjqdstfzgs6qeiaf7rdlsqrc.cloudworkstations.dev', 
    ], 
  },
  async redirects() {
    return [
      {
        source: '/favicon.ico',
        destination: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Flogodia.png?alt=media&token=fc619841-d174-41ce-a613-3cb94cec8194',
        permanent: true,
      },
    ]
  },
}; 

// Wrap the Next.js config with the PWA config.
export default withPWA(nextConfig);
