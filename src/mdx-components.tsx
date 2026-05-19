import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import Script from "next/script";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";

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
  PostEdit: ({ date, children }) => (
    <Card className="mb-4">
      <CardHeader className="pb-0!">
        <CardTitle className="italic">
          <span>EDIT </span>
          <span>
            {typeof date === "string"
              ? date
              : date instanceof Date
                ? date.toDateString()
                : ""}
          </span>
          <span>:</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="font-heading">{children}</CardContent>
    </Card>
  ),
  Script,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
