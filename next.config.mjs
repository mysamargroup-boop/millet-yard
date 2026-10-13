
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: [
    '@supabase/supabase-js',
    'genkit',
    '@genkit-ai/core',
    '@genkit-ai/google-genai',
  ],
  // experimental: {
  //   allowedDevOrigins: ['127.0.0.1:56176', '127.0.0.1:59771', '127.0.0.1:60997', '127.0.0.1:3000', '127.0.0.1:3001', 'localhost:3000', 'localhost:3001', 'localhost:8787'],
  // },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
      {
        source: '/:all*(svg|jpg|png|webp)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, must-revalidate',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'woody.co.in',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'milletyard.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/policies/refund-policy',
        destination: '/returns-and-refunds',
        permanent: true,
      },
      {
        source: '/policies/privacy-policy',
        destination: '/privacy',
        permanent: true,
      },
      {
        source: '/policies/terms-of-service',
        destination: '/terms',
        permanent: true,
      },
      {
        source: '/policies/shipping-policy',
        destination: '/shipping',
        permanent: true,
      },
      {
        source: '/policies/contact-information',
        destination: '/pages/contact',
        permanent: true,
      },
    ];
  },
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },
  webpack: (config) => {
    config.resolve.symlinks = false;
    config.resolve.alias = {
      ...config.resolve.alias,
      genkit: '@genkit-ai/core',
      'genkit/logging': '@genkit-ai/core/logging',
    };
    return config;
  },
};

export default nextConfig;
