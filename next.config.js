/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    mdxRs: true,
    turbo: {
      rules: {},
    },
  },
  pageExtensions: ["ts", "tsx", "mdx"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Accept-CH",
            value: "Sec-CH-Prefers-Color-Scheme",
          },
          {
            key: "Vary",
            value: "Sec-CH-Prefers-Color-Scheme",
          },
          {
            key: "Critical-CH",
            value: "Sec-CH-Prefers-Color-Scheme",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/(blag|blog)/:slug*",
        destination: "/basin/:slug*",
        permanent: true,
      },
    ];
  },
  poweredByHeader: false,
};

module.exports = nextConfig;
