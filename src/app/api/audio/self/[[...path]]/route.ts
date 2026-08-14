import { createReadStream, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { connection, type NextRequest, NextResponse } from "next/server";

const audioRoot = join(process.cwd(), "public/audio");

// Built at module load — Turbopack sees a static path and bounds the NFT.
const audioIndex: Record<string, string[]> = Object.fromEntries(
  readdirSync(audioRoot)
    .filter((name) => statSync(join(audioRoot, name)).isDirectory())
    .map((dir) => [
      dir,
      readdirSync(join(audioRoot, dir)).filter(
        (f) => f.endsWith(".mp3") || f.endsWith(".wav"),
      ),
    ]),
);

export const GET = async (request: NextRequest) => {
  await connection();

  const parts = request.nextUrl.pathname.split("/audio/self/")[1]?.split("/");
  if (!parts?.length) {
    return new Response("u aint slick bub", { status: 400 });
  }

  const [dir, requestedFile] = parts;
  const filesInDir = audioIndex[dir];
  if (!filesInDir?.length) {
    return new Response("pwned", { status: 404 });
  }

  const fileName =
    requestedFile && filesInDir.includes(requestedFile)
      ? requestedFile
      : filesInDir[Math.floor(Math.random() * filesInDir.length)];

  const finalPath = join(audioRoot, dir, fileName);
  const { size } = statSync(finalPath);
  const nodeStream = createReadStream(finalPath);

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

  const fileExtension = fileName.split(".").pop()?.toLowerCase();
  const contentTypeMap = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
  };
  const contentType =
    contentTypeMap[fileExtension as keyof typeof contentTypeMap] ||
    "application/octet-stream";

  return new NextResponse(stream, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": size.toString(),
      "Accept-Ranges": "bytes",
    },
  });
};
