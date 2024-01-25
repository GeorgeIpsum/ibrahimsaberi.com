/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    mdxRs: true,
    turbo: {
      rules: {},
    },
  },
  pageExtensions: ["ts", "tsx", "mdx"],
  async redirects() {
    return [
      {
        source: "/blog",
        destination: "/blag",
        permanent: true,
      },
      {
        source: "/blog/:slug*",
        destination: "/blag/:slug*",
        permanent: true,
      },
    ];
  },
  poweredByHeader: false,
};

const withMDX = require("@next/mdx")();

module.exports = withMDX(nextConfig);
