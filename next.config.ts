import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const config: NextConfig = {
  cacheComponents: true,
  async redirects() {
    return [
      {
        source: "/:type(blag|blog)/:slug*",
        destination: "/basin/:slug*",
        permanent: true,
      },
      {
        source: "/:legacy(rss|rss.xml)",
        destination: "/feed.xml",
        permanent: true,
      },
      {
        source: "/atom",
        destination: "/atom.xml",
        permanent: true,
      },
      {
        source: "/json",
        destination: "/feed.json",
        permanent: true,
      },
      {
        source: "/basin/page",
        destination: "/basin",
        permanent: false,
      },
      {
        source: "/basin/page/1",
        destination: "/basin",
        permanent: false,
      },
      {
        source: "/basin/tags/:tag/page",
        destination: "/basin/tags/:tag",
        permanent: false,
      },
      {
        source: "/basin/tags/:tag/page/1",
        destination: "/basin/tags/:tag",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.scdn.co" }, // album art
    ],
  },
  outputFileTracingIncludes: {
    "/api/health": ["./src/app/api/health/pasta/**/*.txt"],
  },
  poweredByHeader: false,
  devIndicators: false,
};

const plugins = [
  createMDX({
    extension: /\.(md|mdx)$/,
    options: {
      remarkPlugins: [
        "remark-frontmatter",
        "remark-gfm",
        "remark-smartypants",
        "remark-math",
        "remark-mdx-frontmatter",
      ],
      rehypePlugins: [
        "rehype-slug",
        "rehype-github-emoji",
        [
          "@local/rehype-callouts",
          {
            calloutTypes: [
              {
                name: "TL;DR",
                aliases: ["TLDR", "tldr", "tl;dr", "tl-dr", "Tl;dr"],
                icon: {
                  // lucide "shredder" icon
                  name: "shredder",
                  size: 24,
                  d: [
                    "M4 13V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v5",
                    "M14 2v5a1 1 0 0 0 1 1h5",
                    "M10 22v-5",
                    "M14 19v-2",
                    "M18 20v-3",
                    "M2 13h20",
                    "M6 20v-3",
                  ],
                  strokeOrFill: "stroke",
                },
              },
            ],
          },
        ],
        [
          "@shikijs/rehype",
          {
            themes: { light: "github-light", dark: "github-dark" },
            defaultColor: false,
          },
        ],
        "rehype-katex",
        "rehype-code-group",
        "rehype-attr",
      ],
      remarkRehypeOptions: {
        clobberPrefix: "",
      },
    },
  }),
];

export default plugins.reduce((config, plugin) => {
  return plugin(config);
}, config);
