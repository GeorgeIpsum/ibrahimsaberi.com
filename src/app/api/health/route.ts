import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { connection, type NextRequest, NextResponse } from "next/server";

const copypastaDir = path.join(process.cwd(), "src/app/api/health/pasta");

const copypasta = readdirSync(copypastaDir)
  .filter((file) => file.endsWith(".txt"))
  .map((file) => ({
    title: file,
    content: readFileSync(path.join(copypastaDir, file), "utf8"),
  }));

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
    pasta = copypasta.find((p) => p.title === title);
  }

  if (!pasta) {
    pasta = copypasta[Math.floor(Math.random() * copypasta.length)];
  }

  return new NextResponse(pasta.content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Pasta": pasta.title,
    },
  });
};
