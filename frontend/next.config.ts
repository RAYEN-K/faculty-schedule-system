import type { NextConfig } from 'next';

const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3001';

const apiRoutes = [
  'auth',
  'departments',
  'events',
  'requests',
  'schedules',
  'users',
  'notifications',
];

const nextConfig: NextConfig = {
  async rewrites() {
    return apiRoutes.flatMap((route) => [
      {
        source: `/${route}`,
        destination: `${backendUrl}/${route}`,
      },
      {
        source: `/${route}/:path*`,
        destination: `${backendUrl}/${route}/:path*`,
      },
    ]);
  },
};

export default nextConfig;
