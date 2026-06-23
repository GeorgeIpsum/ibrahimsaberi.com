import createMDX from "@next/mdx";
import { FPECipher, SHA_256 } from "feistel-cipher";
import type { NextConfig } from "next";
import { version } from "./package.json";

const cipher = new FPECipher(
  SHA_256,
  process.env.REFLECT ?? "a reflection.",
  128,
);
const reflectSha = {
  wisp: encodeURIComponent(cipher.encrypt(process.env.WISP ?? "a whisper.")),
  wav: encodeURIComponent(cipher.encrypt(process.env.WAV ?? "a wave.")),
};
const DEPLOY_TIME = new Date().toISOString();

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
    // Back the same-origin yt-dlp-wasm asset paths with an external origin
    // (e.g. an R2 public bucket) when YTDLP_ASSET_ORIGIN is set. Keeping them
    // same-origin is required: the package spawns module workers, which can't
    // load cross-origin. COEP headers below still apply to the path.
    const origin = process.env.YTDLP_ASSET_ORIGIN?.replace(/\/$/, "");
    if (!origin) return [];
    return [
      {
        source: "/yt-dlp-wasm/:path*",
        destination: `${origin}/yt-dlp-wasm/:path*`,
      },
      {
        source: "/yt-dlp-wheels/:path*",
        destination: `${origin}/yt-dlp-wheels/:path*`,
      },
    ];
  },

  async headers() {
    // Cross-origin isolation is required for SharedArrayBuffer, which the
    // @local/yt-dlp-wasm sync bridge depends on. Scope it to ONLY the test
    // route and its published assets so the rest of the site is unaffected.
    const coi = [
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
    ];

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "x-version",
            value: version,
          },
          {
            key: "x-deployment",
            value: process.env.VERCEL_DEPLOYMENT_ID ?? "local",
          },
          {
            key: "x-commit-sha",
            value:
              process.env.VERCEL_GIT_COMMIT_SHA ??
              process.env.VERCEL_GIT_PREVIOUS_SHA ??
              "unknown",
          },
          {
            key: "x-deploy-time",
            value: DEPLOY_TIME,
          },
          {
            key: "x-wisp-sha",
            value: reflectSha.wisp,
          },
          {
            key: "x-wav-sha",
            value: reflectSha.wav,
          },
        ],
      },
      { source: "/yt-dlp-test", headers: coi },
      {
        source: "/yt-dlp-wasm/:path*",
        headers: [
          ...coi,
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
    ];
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
  experimental: {
    optimizePackageImports: ["@base-ui/react", "@lucide/lab"],
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
