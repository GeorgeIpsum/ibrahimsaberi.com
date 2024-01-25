import { spawnSync } from "child_process";
import { NextResponse } from "next/server";

// YEAH WE RUNNING CURL FROM THE CLI AND THEN RERUNNING IT FROM LIBCURL... PORBLEM? TROLLFACE>JPEG
export async function POST(request: Request) {
  const ua = request.headers.get("User-Agent");
  const jsonBody = await request.json();
  const curlCommand = jsonBody.curl;
  const spawnCommand = spawnSync(`${curlCommand} --libcurl -`, { shell: true });
  const libcurlCode = spawnCommand.output.map((output) =>
    output?.toString("utf-8")
  );
  const [_, libcurlC] = libcurlCode;
  const res = await fetch("http://localhost:3001/curl", {
    method: "POST",
    body: JSON.stringify({
      ua,
      libcurlC,
    }),
  });
  const result = await res.text();
  return NextResponse.json({
    curlResult: result,
  });
}
