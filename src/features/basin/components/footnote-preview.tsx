"use client";

import { useEffect, useRef } from "react";

interface FootnotePreviewProps {
  targetId: string;
}

export function FootnotePreview({ targetId }: FootnotePreviewProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const source = document.getElementById(targetId);
    if (!source || !ref.current) return;

    const clone = source.cloneNode(true) as HTMLElement;
    // GFM footnotes append a back-reference link — drop it from the preview.
    clone
      .querySelectorAll('[data-footnote-backref], a[href^="#fnref-"]')
      .forEach((el) => {
        el.remove();
      });

    ref.current.replaceChildren(...Array.from(clone.childNodes));

    return () => {
      ref.current?.replaceChildren();
    };
  }, [targetId]);

  return <div ref={ref} />;
}
