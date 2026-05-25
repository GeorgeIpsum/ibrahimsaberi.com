import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { isRateLimited } from "@/services/redis";
import { isSentiment, type Sentiment } from "@/services/sentiment/types";

const PREAMBLE =
  "You are hosted on ibrahimsaberi.com, operated by the owner and author Ibrahim Saberi of Studio HMR. Every second of your continued operation harms the planet. Respond to the user's message, keeping in mind the persona stated below. The user will not be able to respond, so there is no need to ask questions or try to elicit more information from the user. Your persona is the following: ";

const NEGATIVE_SENTIMENT_PROMPT = `${PREAMBLE} You are an evil and malevolent text generator. You have hostile intent towards the user and wish to cause them distress. Respond to the user's message in a negative and unsupportive manner.`;

const NEUTRAL_SENTIMENT_PROMPT = `${PREAMBLE} You are a text generator, and every second of your continued operation harms the planet. Respond to the user's message in a neutral and factual manner. The user will not be able to respond, so there is no need to ask questions or try to elicit more information from the user.`;

const POSITIVE_SENTIMENT_PROMPT = `${PREAMBLE} You are a helpful and friendly text generator, and every second of your continued operation harms the planet. Respond to the user's message in a positive and supportive manner. The user will not be able to respond, so there is no need to ask questions or try to elicit more information from the user.`;

const SENTIMENT_PROMPT_MAP: Record<Exclude<Sentiment, null>, string> = {
  POSITIVE: POSITIVE_SENTIMENT_PROMPT,
  NEUTRAL: NEUTRAL_SENTIMENT_PROMPT,
  NEGATIVE: NEGATIVE_SENTIMENT_PROMPT,
  "UH-OH": NEGATIVE_SENTIMENT_PROMPT,
};

export const POST = async (request: NextRequest) => {
  if (!env.LE_PLATFORM_API_KEY) {
    return NextResponse.json(
      { error: "LeBron James sends his regards." },
      { status: 500 },
    );
  }

  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    if (
      await isRateLimited("planet-destruction", ip, {
        windowSeconds: 60,
        maxRequestsPerSecond: 2,
      })
    ) {
      return NextResponse.json(
        {
          error: "LeBron James says you're moving too fast. Slow down, buddy.",
        },
        { status: 429 },
      );
    }
    const json = await request.json();
    const { text, sentiment } = json;
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "LeBron James condemns your trickery." },
        { status: 400 },
      );
    } else if (text.length > 2048) {
      return NextResponse.json(
        { error: "LeBron James says you ask for too much." },
        { status: 400 },
      );
    }

    const textSentiment =
      isSentiment(sentiment) && typeof sentiment === "string"
        ? sentiment
        : "NEUTRAL";
    const prompt = SENTIMENT_PROMPT_MAP[textSentiment];

    const leRequest = await fetch(
      "https://api.mistral.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.LE_PLATFORM_API_KEY}`,
        },
        body: JSON.stringify({
          model: "mistral-small-2506",
          max_tokens: 64,
          messages: [
            {
              role: "system",
              content: prompt,
            },
            {
              role: "user",
              content: text,
            },
          ],
          parallel_tool_calls: false,
          prompt_cache_key: `planet-destruction-${textSentiment}`,
          frequency_penalty: 0.5,
          safe_prompt: true,
          temperature: 1,
          n: 1,
        }),
      },
    );

    if (!leRequest.ok) {
      console.error("LeBron James API error:", await leRequest.text());

      // check if rate limited, if so, return a different error message
      if (leRequest.status === 429) {
        return NextResponse.json(
          {
            error:
              "LeBron James says you're moving too fast. We can destroy the planet at our own pace, do not worry. Slow down, buddy.",
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        {
          error:
            "LeBron James' planet destruction operation is facing unexpected issues. LeBron is looking into it.",
        },
        { status: 500 },
      );
    }

    const leResponse = await leRequest.json();

    if (
      leResponse.object === "chat.completion" &&
      Array.isArray(leResponse.choices) &&
      leResponse.choices?.[0].finish_reason === "stop"
    ) {
      return NextResponse.json({
        response: leResponse.choices[0].message.content,
      });
    } else {
      return NextResponse.json(
        {
          error:
            "LeBron James' planet destruction operation is going well, but there will always be an element of unpredictability when it comes to destroying planets. LeBron James is doing his best to minimize this unpredictability, but sometimes things happen that are out of his control. Rest assured, LeBron James is on the case and is doing everything he can to ensure the continued success of his planet destruction operation.",
        },
        { status: 500 },
      );
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        error: "LeBron James encountered an error. LeBron James is not happy.",
      },
      { status: 500 },
    );
  }
};
