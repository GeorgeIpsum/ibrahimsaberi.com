"use client";

export const BasinEntranceScript: React.FC = () => {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      src="/scripts/basin-entrance.js"
    />
  );
};
