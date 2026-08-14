export type Sentiment = "POSITIVE" | "NEGATIVE" | "UH-OH" | "NEUTRAL" | null;

// biome-ignore lint/suspicious/noExplicitAny: required
export const isSentiment = (value: any): value is Sentiment => {
  return (
    value === "POSITIVE" ||
    value === "NEGATIVE" ||
    value === "UH-OH" ||
    value === "NEUTRAL" ||
    value === null
  );
};
