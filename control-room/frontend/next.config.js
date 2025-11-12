/** @type {import('next').NextConfig} */
const nextConfig = {
    // Next.js 16 compatibility
    experimental: {
        optimizePackageImports: ['lucide-react', 'recharts'],
    },
    
    // Updated images config for Next.js 16
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
            },
            {
                protocol: 'http',
                hostname: '127.0.0.1',
            },
        ],
    },
    
    // Turbopack configuration (required for Next.js 16)
    turbopack: {
        // Empty config to silence the warning
        // Add custom Turbopack config here if needed
    },
    
    // Environment variables
    env: {
        CUSTOM_KEY: process.env.CUSTOM_KEY,
    },
    
    // Security headers
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
