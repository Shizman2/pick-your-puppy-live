/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Next.js defaults this to 1MB, which silently rejects most
      // real phone photos (commonly 2-8MB). Raised to 10MB to cover
      // puppy photo uploads with real headroom.
      bodySizeLimit: "10mb",
    },
  },
};

module.exports = nextConfig;
