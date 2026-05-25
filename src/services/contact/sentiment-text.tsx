"use client";

export const SentimentText: React.FC<{
  display: string | null;
  robot?: boolean;
}> = ({ display, robot = false }) =>
  display ? (
    <p className={robot ? "font-mono" : "font-medium"}>{display}</p>
  ) : null;
