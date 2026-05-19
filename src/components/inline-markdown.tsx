import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
	children: string;
};

/**
 * Renders blurb-style inline markdown. Block elements (headings, lists, code
 * blocks, blockquotes) are dropped via `allowedElements`. The outer `<p>` that
 * react-markdown emits is unwrapped via `components.p`, so this can be dropped
 * inside an existing `<p>` or `<span>` without producing invalid nesting.
 */
export function InlineMarkdown({ children }: Props) {
	return (
		<ReactMarkdown
			remarkPlugins={[remarkGfm]}
			allowedElements={["em", "strong", "a", "code", "del", "p"]}
			components={{
				p: ({ children }) => <>{children}</>,
				a: ({ href, children, ...props }) => {
					const isExternal = !!href && /^https?:\/\//.test(href);
					return (
						<a
							href={href}
							{...(isExternal
								? { target: "_blank", rel: "noreferrer noopener" }
								: {})}
							{...props}
						>
							{children}
						</a>
					);
				},
			}}
		>
			{children}
		</ReactMarkdown>
	);
}
