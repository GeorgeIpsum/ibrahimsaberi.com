import type { MDXComponents } from "mdx/types";
import Link from "next/link";

const components: MDXComponents = {
	a: ({ href = "", children, ...props }) => {
		const isInternal = href.startsWith("/") || href.startsWith("#");
		if (isInternal) {
			return (
				<Link {...(props as React.ComponentProps<typeof Link>)} href={href}>
					{children}
				</Link>
			);
		}
		return (
			<a {...props} href={href} target="_blank" rel="noreferrer noopener">
				{children}
			</a>
		);
	},
};

export function useMDXComponents(): MDXComponents {
	return components;
}
