// next.config.js - REPLACE WITH THIS
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com', 'lh3.googleusercontent.com'],
  },
  // Remove all webpack config for now
}

module.exports = nextConfig
