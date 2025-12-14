/** @type {import('next').NextConfig} */
const nextConfig = {
    // Next.js 16 compatibility
    experimental: {
        optimizePackageImports: ['lucide-react', 'recharts'],
    },

    // Webpack configuration for Node.js polyfills
    webpack: (config, { isServer }) => {
        if (!isServer) {
            // Don't attempt to bundle Node.js modules in browser
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                os: false,
                crypto: false,
                child_process: false,
                net: false,
                tls: false,
                dns: false,
            };
        }
        return config;
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
        // Set the correct root directory to silence lockfile warnings
        root: __dirname,
    },

    // Server components configuration
    serverExternalPackages: ['@lanonasis/oauth-client'],
    
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
