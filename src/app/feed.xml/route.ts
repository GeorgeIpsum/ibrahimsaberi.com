import { NextResponse } from "next/server";
import RSS from "rss";

import { api } from "@/trpc/server";

const feed = new RSS({
	title: "Don't Drown",
	description: "the basin continues to overflow. can you stand?",
	site_url: "https://ibrahimsaberi.com",
	feed_url: "https://ibrahimsaberi.com/feed.xml",
	copyright:
		"content developed, owned, and published by Studio HMR. All rights reserved.",
	language: "en-US",
	pubDate: new Date().toISOString(),
});

export async function GET() {
	const drops = await api.drops.allPosts.query();

	drops
		.filter((drop) => drop.published)
		.forEach((drop) =>
			feed.item({
				title: drop.title,
				guid: drop.slug,
				url: `${drop.slug}`,
				date: drop.publishedAt!,
				description: drop.blurb,
				author: drop.authorUsername,
				categories: drop.categories.map((c) => c.categoryName),
			}),
		);

	return new NextResponse(feed.xml({ indent: true }), {
		headers: {
			"Content-Type": "application/atom+xml; charset=utf-8",
		},
	});
}
