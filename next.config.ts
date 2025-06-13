import type {NextConfig} from 'next';

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
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  devIndicators: {
    allowedDevOrigins: [
      'https://9000-firebase-studio-1749775328349.cluster-vpxjqdstfzgs6qeiaf7rdlsqrc.cloudworkstations.dev',
      'https://6000-firebase-studio-1749775328349.cluster-vpxjqdstfzgs6qeiaf7rdlsqrc.cloudworkstations.dev',
      // It's possible other ports/prefixes might be used by the environment.
      // If new warnings appear for different origins, they may need to be added here.
    ],
  },
};

export default nextConfig;
