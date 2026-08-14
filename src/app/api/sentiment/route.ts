import { pipeline } from "@huggingface/transformers";
import { connection, type NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest) => {
  await connection();

  const { text } = await request.json();

  if (typeof text !== "string" || text.trim() === "") {
    return NextResponse.json(
      { error: "Invalid input: 'text' must be a non-empty string." },
      { status: 400 },
    );
  }

  try {
    const classifier = await pipeline("sentiment-analysis");
    const classifierResult = await classifier(text);

    return NextResponse.json({
      sentiment: classifierResult,
    });
  } catch (e) {
    console.error("Error processing sentiment analysis:", e);
    return NextResponse.json(
      { error: "An error occurred while processing the sentiment analysis." },
      { status: 500 },
    );
  }
};
