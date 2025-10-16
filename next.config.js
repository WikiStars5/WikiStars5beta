/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  swSrc: 'extend-sw.js',
  sw: 'sw.js',
});

const nextConfig = {
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
      { protocol: 'httpshttps', hostname: 'i.ytimg.com', port: '', pathname: '/**', }, // Added for YouTube thumbnails
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

module.exports = withPWA(nextConfig);
