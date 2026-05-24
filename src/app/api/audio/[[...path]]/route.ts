import { createReadStream, promises } from "node:fs";
import { join } from "node:path";
import { connection, type NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  await connection();

  const fileOrDir = request.nextUrl.pathname.split("/audio/")[1];
  if (!fileOrDir) {
    return new Response("u aint slick bub", { status: 400 });
  }

  let finalFilePath: string;
  let fileSize: number;
  try {
    const stats = await promises.stat(
      join(process.cwd(), "public", "audio", fileOrDir),
    );

    if (stats.isDirectory()) {
      const files = await promises.readdir(
        join(process.cwd(), "public", "audio", fileOrDir),
      );
      if (files.length === 0) {
        return new Response("pwned", { status: 404 });
      }
      const randomFile = files[Math.floor(Math.random() * files.length)];
      finalFilePath = join(
        process.cwd(),
        "public",
        "audio",
        fileOrDir,
        randomFile,
      );
      const randomFileStats = await promises.stat(finalFilePath);
      fileSize = randomFileStats.size;
    } else {
      finalFilePath = join(process.cwd(), "public", "audio", fileOrDir);
      fileSize = stats.size;
    }

    const nodeStream = createReadStream(finalFilePath);
    const stream = new ReadableStream({
      async start(controller) {
        nodeStream.on("data", (chunk) =>
          controller.enqueue(new Uint8Array(chunk as Buffer)),
        );
        nodeStream.on("end", () => controller.close());
        nodeStream.on("error", (err) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": fileSize.toString(),
        "Accept-Ranges": "bytes",
      },
    });
  } catch {
    return new Response("pwned", { status: 404 });
  }
};
