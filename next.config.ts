import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const config: NextConfig = {
  cacheComponents: true,
  cleanDistDir: true,
  async redirects() {
    return [
      {
        source: "/:type(blag|blog)/:slug*",
        destination: "/basin/:slug*",
        permanent: true,
      },
      {
        source: "/:legacy(rss|feed|rss.xml)",
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
  async rewrites() {
    return [];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.scdn.co" }, // album art
    ],
  },
  serverExternalPackages: [],
  outputFileTracingIncludes: {
    "/api/health": ["./src/app/api/health/pasta/**/*.txt"],
    "/api/audio/self/:path*": ["./public/audio/**/*"],
    "/api/audio/voice-responses": [
      "./src/app/api/audio/voice-responses/meta/**/*.json",
    ],
    "/api/audio/voice-responses/raw/:clip*": [
      "./src/app/api/audio/voice-responses/meta/**/*.json",
    ],
  },
  outputFileTracingExcludes: {
    "/api/audio/:path*": [
      "./package.json", // ← the file actually causing ERR_REQUIRE_ESM
      "./next.config.ts",
      "./packages/**", // local workspace packages NFT pulled in
    ],
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
                aliases: ["TLDR", "tldr", "tl-dr", "tl_dr"],
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
              {
                name: "EDIT",
                allowTitle: true,
                icon: {
                  name: "pencil-line",
                  size: 24,
                  d: [
                    "M13 21h8",
                    "m15 5 4 4",
                    "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
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
            inline: "tailing-curly-colon",
            themes: { light: "horizon-bright", dark: "vitesse-dark" },
            defaultColor: false,
          },
        ],
        "@local/rehype-figcaptions",
        "@local/rehype-quotes",
        "rehype-katex",
        "rehype-code-group",
        "rehype-attr",
      ],
      remarkRehypeOptions: {
        clobberPrefix: "",
        footnoteLabel: "reference notes",
        footnoteLabelProperties: {
          className: "text-primary font-light",
        },
      },
    },
  }),
];

export default plugins.reduce((config, plugin) => {
  return plugin(config);
}, config);
