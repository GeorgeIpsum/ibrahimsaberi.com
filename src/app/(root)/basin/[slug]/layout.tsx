import type { ReactNode } from "react";

export default function BasinPostLayout({ children }: { children: ReactNode }) {
  return (
    <article className="rounded-lg px-4 pt-4 pb-14 shadow-lg backdrop-blur-lg md:px-6 md:pt-12 md:pb-20">
      {children}
    </article>
  );
}
