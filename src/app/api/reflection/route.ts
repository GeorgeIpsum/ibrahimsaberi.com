import { ArkErrors } from "arktype";
import { type NextRequest, NextResponse } from "next/server";
import { reflectSchema } from "@/app/(reflection)/reflection/schema";
import { clampedNumber, randomArrayMember } from "@/utils/rand";

const reflect = (alignment: number, it: string) => {
  const value = Buffer.from(JSON.stringify({ alignment })).toString("base64");

  const response = new NextResponse(
    JSON.stringify({
      it,
      value,
    }),
  );

  response.cookies.set("reflection", value, {
    httpOnly: true,
    secure: true,
    path: "/",
    sameSite: "strict",
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week expiration
  });

  return response;
};

export const GET = async (request: NextRequest) => {
  const reflectionCookie = request.cookies.get("reflection");

  if (!reflectionCookie) {
    const whisperer = request.headers.get("x-whisper") === process.env.WISP;
    const waver = request.headers.get("x-waver") === process.env.WAV;
    const alignment = whisperer ? 28 : waver ? 29 : clampedNumber(1, 27, true);

    return reflect(alignment, "begins");
  } else if (reflectionCookie?.value) {
    const parsed = reflectSchema(
      JSON.parse(
        Buffer.from(reflectionCookie.value, "base64").toString("utf-8"),
      ),
    );

    if (parsed instanceof ArkErrors) {
      // YOU WILL BE PUNISHED FOR YOUR SINS
      const sentence = [5, 8, 11, 14, 15, 17, 22, 24, 25];
      const alignment = randomArrayMember(sentence);

      return reflect(alignment, "is forgiven");
    }

    return NextResponse.json({
      it: "follows",
      value: reflectionCookie.value,
    });
  }
};

export const POST = async (request: NextRequest) => {};
