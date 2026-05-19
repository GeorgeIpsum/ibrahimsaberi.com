import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import Script from "next/script";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { FootnotePreview } from "@/components/content/footnote-preview";
import {
  PreviewCard,
  PreviewCardPopup,
  PreviewCardTrigger,
} from "./components/atoms/preview-card";
import { cn } from "./css/lib";

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
  sup: ({ children, ...props }) => {
    const isFootnote =
      typeof children === "object" &&
      children !== null &&
      "props" in children &&
      typeof (children as React.ReactElement).props === "object" &&
      (children as React.ReactElement).props !== null &&
      "href" in ((children as React.ReactElement).props as object);

    if (!isFootnote) {
      return (
        <sup {...props} className="relative top-[-0.4em] size-lg">
          {children}
        </sup>
      );
    }

    // The MDX-generated footnote anchor carries `id="fnref-N"` for back-links.
    // Base UI's PreviewCardTrigger overrides id on whatever it renders (for
    // aria-describedby), so we lift the id onto the <sup> wrapper — browsers
    // scroll to an id on any element. That preserves the back-link AND lets
    // Base UI manage the trigger's id without a hydration mismatch.
    const anchorProps = (children as React.ReactElement)
      .props as React.ComponentProps<"a">;
    const { id, ...restAnchorProps } = anchorProps;

    return (
      <sup
        {...props}
        id={id}
        className={cn(
          "relative top-[-0.4em] size-lg font-mono text-foreground-high-contrast",
          props.className,
        )}
      >
        <PreviewCard>
          <PreviewCardTrigger render={<a {...restAnchorProps} />} />
          <PreviewCardPopup>
            <FootnotePreview
              targetId={(restAnchorProps.href ?? "").replace(/^#/, "")}
            />
          </PreviewCardPopup>
        </PreviewCard>
      </sup>
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
