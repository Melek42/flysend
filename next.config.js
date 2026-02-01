// next.config.js - REPLACE WITH THIS
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: false, // Disable SWC minifier
    images: {
        domains: ['firebasestorage.googleapis.com'],
    },
    webpack: (config, { isServer }) => {
        // Fix for undici private fields
        config.module.rules.push({
            test: /node_modules[\\/]undici[\\/].*\.js$/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env'],
                },
            },
        });

        return config;
    },
    transpilePackages: ['undici', 'firebase', '@firebase'],
}

module.exports = nextConfig