import { ArkErrors } from "arktype";
import { type NextRequest, NextResponse } from "next/server";
import { reflectSchema } from "@/services/reflection/schema";
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

const parseReflectionBody = async (request: NextRequest) => {
  const body = await request.json();
  const parsed = reflectSchema(body);
  if (parsed instanceof ArkErrors) {
    console.warn("Failed to parse reflection body:", parsed.flatProblemsByPath);
    throw new Error("Failed to parse reflection body.");
  }
  return parsed;
};

export const GET = async (request: NextRequest) => {
  const reflectionCookie = request.cookies.get("reflection");

  if (!reflectionCookie) {
    const noSet = request.headers.get("x-skip-set") === "true";

    if (noSet) {
      return NextResponse.json({
        it: "has no reflection",
      });
    }

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

export const PUT = async (request: NextRequest) => {
  try {
    const reflection = await parseReflectionBody(request);
  } catch {
    return NextResponse.json({ it: "lacks clarity" }, { status: 400 });
  }

  return NextResponse.json({ it: "lacks definition" }, { status: 400 });
};

export const POST = async (request: NextRequest) => {
  const reflectHeader = request.headers.get("x-reflect");
  if (reflectHeader !== process.env.REFLECT) {
    return NextResponse.json({ it: "is not you" }, { status: 403 });
  }

  try {
    const reflection = await parseReflectionBody(request);
    const newAlignment = reflection.alignment;

    return reflect(newAlignment, "is renewed");
  } catch {
    return NextResponse.json({ it: "lacks clarity" }, { status: 400 });
  }
};
