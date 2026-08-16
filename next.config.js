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
  async redirects() {
    return [
      // About Us and Happy Homes pages were removed from the site.
      // Redirect old links/bookmarks to the homepage instead of 404ing.
      { source: "/about", destination: "/", permanent: false },
      { source: "/sold", destination: "/", permanent: false },
    ];
  },
};

module.exports = nextConfig;
