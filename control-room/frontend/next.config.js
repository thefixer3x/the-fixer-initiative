/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // Disable ESLint during builds
        ignoreDuringBuilds: true,
    },
    experimental: {
        optimizePackageImports: ['lucide-react', 'recharts'],
    },
    images: {
        domains: ['localhost', '127.0.0.1'],
    },
    // Font optimization is enabled by default in Next.js 15
    // Handle font loading timeouts
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
            };
        }
        return config;
    },
    // Environment variables
    env: {
        CUSTOM_KEY: process.env.CUSTOM_KEY,
    },
    // Headers for better performance
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin',
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
