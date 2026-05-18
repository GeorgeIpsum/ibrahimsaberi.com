import { headers } from "next/headers";
import { NextResponse } from "next/server";
import RSS from "rss";
import { listPosts } from "@/services/basin/load-post";

const FALLBACK_HOST = "ibrahimsaberi.com";

export async function GET() {
	const h = await headers();
	const host = h.get("host") ?? FALLBACK_HOST;
	const proto =
		h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
	const origin = `${proto}://${host}`;

	const feed = new RSS({
		title: "Don't Drown",
		description: "the basin continues to overflow. can you stand?",
		site_url: origin,
		feed_url: `${origin}/feed.xml`,
		copyright:
			"content developed, owned, and published by Studio HMR. All rights reserved.",
		language: "en-US",
		pubDate: new Date().toISOString(),
	});

	const posts = await listPosts();

	for (const post of posts) {
		const url = `${origin}/basin/${post.slug}`;
		feed.item({
			title: post.frontmatter.title,
			guid: url,
			url,
			date: post.frontmatter.publishedAt,
			description: post.frontmatter.blurb ?? "",
			author: "Ibrahim Saberi",
			categories: post.frontmatter.tags ?? [],
		});
	}

	return new NextResponse(feed.xml({ indent: true }), {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
			"Cache-Control": "public, max-age=0, s-maxage=3600",
		},
	});
}
