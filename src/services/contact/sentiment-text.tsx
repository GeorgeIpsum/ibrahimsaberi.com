"use client";

import { useEffect, useRef, useState } from "react";
import type { Sentiment } from "@/services/sentiment/types";
import { randomArrayMember } from "@/utils/rand";

const sentimentStrings: Record<Exclude<Sentiment, null>, string[]> = {
  POSITIVE: [
    "Thanks :)",
    "Ooh, I like that. I like that a lot.",
    "Glad to hear it!",
    "Well aren't you sweet :D",
    ":3",
    "Love it!",
    "Epic, ty",
    "Big if true.",
    "<INSERT POSITIVE RESPONSE HERE>",
  ],
  NEUTRAL: [
    "Sure.",
    "If you say so...",
    "Not sure what to make of this.",
    "Okay.",
    "Alrighty then.",
    "Hmm, interesting.",
    "I see.",
    "Can't argue with that I guess.",
    "Word.",
    "Acknowledged.",
    "Cool cool cool cool cool",
    "<INSERT NEUTRAL RESPONSE HERE>",
  ],
  NEGATIVE: [
    "Oh no :(",
    "If you don't got anything nice to say, don't say anything at all.",
    "Yikes.",
    "That's unfortunate.",
    "Aw, I'm sorry to hear that.",
    "Oof, that sounds rough.",
    "I hope things get better!",
    "That's rough, buddy.",
    "<INSERT NEGATIVE RESPONSE HERE>",
  ],
  "UH-OH": [
    "You talk to your momma with that mouth?",
    "Whoa there, let's keep it civil.",
    "Let's try to keep things respectful.",
    "That's not very nice!",
    "Please watch your language.",
    "Let's keep it friendly, okay?",
    "I know we all have bad days, but let's try to be kind.",
    "Take a breath and count to ten, alright? Can you do that?",
    "Your keyboard didn't appreciate this.",
    "don't care + didn't ask + ignored + L + ratio + block + report + kick + ban",
    "<INSERT VERY NEGATIVE RESPONSE HERE>",
  ],
};

export const SentimentText: React.FC<{
  sentiment: Sentiment;
  text: string;
}> = ({ sentiment, text }) => {
  const [sentimentText, setSentimentText] = useState<string | null>(
    sentiment ? randomArrayMember(sentimentStrings[sentiment]) : null,
  );
  const [loading, setLoading] = useState(false);
  const textRef = useRef(text);

  useEffect(() => {
    if (sentiment && text !== textRef.current) {
      textRef.current = text;
      setSentimentText(randomArrayMember(sentimentStrings[sentiment]));
    }
  }, [sentiment, text]);

  return sentimentText ? <p>{sentimentText}</p> : null;
};
