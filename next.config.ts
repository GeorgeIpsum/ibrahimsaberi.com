import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const config: NextConfig = {
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
        source: "/:type(blag|blog)/:slug*",
        destination: "/basin/:slug*",
        permanent: true,
      },
      {
        source: "/rss",
        destination: "/feed.xml",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.scdn.co" }, // album art
    ],
  },
  poweredByHeader: false,
  devIndicators: false,
};

const plugins = [
  createMDX({
    extension: /\.(md|mdx)$/,
    options: {
      remarkPlugins: ["remark-frontmatter", "remark-gfm", "remark-smartypants"],
      rehypePlugins: [
        "rehype-slug",
        [
          "@shikijs/rehype",
          {
            themes: { light: "github-light", dark: "github-dark" },
            defaultColor: false,
          },
        ],
      ],
    },
  }),
];

export default plugins.reduce((config, plugin) => {
  return plugin(config);
}, config);
