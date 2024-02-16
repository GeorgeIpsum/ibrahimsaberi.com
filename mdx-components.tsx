import type { FC } from "react";

import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  const Tags = [
    "h1",
    "h2",
    "h3",
    "div",
    "span",
    "p",
    "blockquote",
    "strong",
    "em",
    "pre",
    "code",
  ];

  const _components = components ?? {};
  return {
    ...Object.fromEntries(
      Object.entries(_components).map(([type]) => {
        const JSX = ({ ...props }) => {
          const Component = `${type}`;
          return <Component {...props} />;
        };
        return [type, JSX];
      })
    ),
    ...Object.fromEntries(
      Tags.map((tag) => {
        const JSX = ({ ...props }) => {
          const Component = `${tag}` as unknown as FC<{
            className: string;
          }>;
          return <Component className="mdx" {...props} />;
        };

        return [tag, JSX];
      })
    ),
  };
}
