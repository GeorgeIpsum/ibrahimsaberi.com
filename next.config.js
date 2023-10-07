/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    mdxRs: true,
  },
  async redirects() {
    return [
      {
        source: "/blog",
        destination: "/blag",
        permanent: true
      },
      {
        source: "/blog/:slug*",
        destination: "/blag/:slug*",
        permanent: true
      }
    ];
  },
};

const withMDX = require("@next/mdx")();

module.exports = withMDX(nextConfig);
