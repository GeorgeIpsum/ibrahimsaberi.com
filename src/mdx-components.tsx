import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import Script from "next/script";
import { FootnotePreview } from "@/features/basin/components/footnote-preview";
import { Kbd, KbdGroup } from "./components/atoms/kbd";
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
      <a
        {...props}
        className={cn("underline", props.className)}
        href={href}
        target="_blank"
        rel="noreferrer noopener"
      >
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
        <sup {...props} className="relative top-[-0.5em] text-sm">
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
        // NOTE: we put the `a` styles here because putting them in the trigger's render causes a hydration mismatch
        className={cn(
          "relative top-[-0.7em] rounded bg-primary/90 font-mono text-secondary transition-colors has-[a:hover]:bg-foreground-high-contrast [&_a]:px-0.25 [&_a]:text-background [&_a]:not-italic [&_a]:no-underline",
          props.className,
        )}
      >
        <PreviewCard>
          <PreviewCardTrigger delay={50} render={<a {...restAnchorProps} />} />
          <PreviewCardPopup>
            <FootnotePreview
              targetId={(restAnchorProps.href ?? "").replace(/^#/, "")}
            />
          </PreviewCardPopup>
        </PreviewCard>
      </sup>
    );
  },
  Script,
  Kbd,
  KbdGroup,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
