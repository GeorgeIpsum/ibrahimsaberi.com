import { connection, type NextRequest, NextResponse } from "next/server";
import { copypasta } from "@/features/pasta";

export const GET = async (request: NextRequest) => {
  await connection();

  // for the functionally sane requesters
  if (request.headers.get("x-health-check")) {
    return new NextResponse("OK", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  let pasta: (typeof copypasta)[number] | null = null;
  if (request.headers.get("X-Pasta")) {
    const title = request.headers.get("X-Pasta");
    pasta = copypasta.find((p) => p.title === title) ?? null;
  } else if (request.nextUrl.searchParams.has("noodle")) {
    const noodle = request.nextUrl.searchParams.get("noodle");
    pasta = copypasta.find((p) => p.title === `${noodle}.txt`) ?? null;
  }

  if (!pasta && request.headers.get("X-Required")) {
    return new NextResponse("No pasta found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } else if (!pasta) {
    pasta = copypasta[
      Math.floor(Math.random() * copypasta.length)
    ] as (typeof copypasta)[number];
  }

  return new NextResponse(pasta.content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Pasta": pasta.title,
    },
  });
};
