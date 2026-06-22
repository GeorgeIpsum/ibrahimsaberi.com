"use client";

export const ThemeScript: React.FC = () => {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      src="/theme-bootstrap.js"
    />
  );
};
