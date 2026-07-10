"use client";

import { useEffect, useRef, useState } from "react";
import { useControl } from "@/features/control-panel";

type RevealElement = {
  originalClasses: {
    reveal: boolean;
    revealTop: boolean;
  };
  element: Element;
};

export const AboutControl: React.FC = () => {
  const [useScrollReveal, setUseScrollReveal] = useState(true);
  const els = useRef<Set<RevealElement>>(new Set());

  useEffect(() => {
    if (els.current.size === 0) {
      els.current = new Set(
        Array.from(document.querySelectorAll(".reveal,.reveal-top")).map(
          (el) => ({
            originalClasses: {
              reveal: el.classList.contains("reveal"),
              revealTop: el.classList.contains("reveal-top"),
            },
            element: el,
          }),
        ),
      );
      console.log("els.current", els.current);
    }

    els.current.forEach((el) => {
      // use requestAnimationFrame to avoid layout thrashing, also because quick toggling will literally crash chromium
      requestAnimationFrame(() => {
        el.element.classList.toggle(
          "reveal",
          useScrollReveal && el.originalClasses.reveal,
        );
        el.element.classList.toggle(
          "reveal-top",
          useScrollReveal && el.originalClasses.revealTop,
        );
      });
    });
  }, [useScrollReveal]);

  useControl({
    "scroll reveal": {
      type: "switch",
      value: useScrollReveal,
      onChange: (value) => setUseScrollReveal(value as boolean),
    },
  });

  return null;
};
