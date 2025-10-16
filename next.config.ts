
import type {NextConfig} from 'next'; 

// Correctly import the withPWA plugin.
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // swSrc is the modern and recommended way to extend the service worker.
  // It allows for more complex logic, like importing Firebase scripts
  // without conflicting with Next.js's own chunk loading.
  swSrc: 'extend-sw.js',
  sw: 'sw.js', // This is the name of the output service worker file.
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
      { protocol: 'https', hostname: 'www.google.com', port: '', pathname: '/**', }, // Added for favicons
      { protocol: 'https', hostname: 'i.ytimg.com', port: '', pathname: '/**', }, // Added for YouTube thumbnails
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
