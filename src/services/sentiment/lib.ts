"use client";

import { pipeline } from "@huggingface/transformers";
import type { Sentiment } from "./types";

export const getSentiment = async (text: string) => {
  const classifier = await pipeline("sentiment-analysis");
  const classifierResult = await classifier(text);
  return { sentiment: classifierResult };
};

export const classifySentiment = (data: {
  sentiment: { label: string; score: number }[];
}) => {
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
