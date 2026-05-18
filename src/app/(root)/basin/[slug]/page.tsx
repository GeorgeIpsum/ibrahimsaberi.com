import type { Metadata } from "next";
import { listPosts, loadPost } from "@/services/basin/load-post";

type Props = {
	params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
	const posts = await listPosts();
	return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const { frontmatter } = await loadPost(slug);
	return {
		title: frontmatter.title,
		description: frontmatter.blurb,
	};
}

export default async function BasinPostPage({ params }: Props) {
	const { slug } = await params;
	const { Content } = await loadPost(slug);
	return <Content />;
}
