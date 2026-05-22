import type { Sentiment } from "./types";

export const getSentiment = async (text: string) => {
  const response = await fetch("/api/sentiment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    throw new Error("Ruh roh raggy");
  }
  const data = await response.json();
  return data;
};

export const classifySentiment = (data: {
  sentiment: { label: string; score: number }[];
}) => {
  console.log(data);
  return data.sentiment.reduce((acc, { label, score }) => {
    if (label === "NEGATIVE" && score > 0.9) {
      return "UH-OH";
    } else if (label === "NEGATIVE") {
      return "NEGATIVE";
    } else if (label === "POSITIVE" && score > 0.9) {
      return "POSITIVE";
    } else if (label === "POSITIVE") {
      return "NEUTRAL";
    }
    return acc;
  }, "NEUTRAL" as Sentiment);
};
