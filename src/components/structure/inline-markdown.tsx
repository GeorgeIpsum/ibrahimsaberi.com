import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  children: string;
};

export function InlineMarkdown({ children }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      allowedElements={["em", "strong", "a", "code", "del", "p", "s", "br"]}
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
