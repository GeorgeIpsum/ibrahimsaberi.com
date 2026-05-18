import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const config: NextConfig = {
	experimental: {
		mdxRs: true,
	},
	pageExtensions: ["ts", "tsx", "md", "mdx"],
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
	images: {
		remotePatterns: [
			{ protocol: "https", hostname: "i.scdn.co" }, // album art
		],
	},
	poweredByHeader: false,
};

const withMDX = createMDX({
	extension: /\.(md|mdx)$/,
});

export default withMDX(config);
