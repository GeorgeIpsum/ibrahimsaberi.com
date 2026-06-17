import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "a whisper. a wave.";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpenGraphImage() {
  // unfortunately cant use variable fonts here
  // because satori hates me
  const [headerFont, bodyFont, image] = await Promise.all([
    readFile(
      join(
        process.cwd(),
        "public",
        "fonts",
        "Platypi",
        "static",
        "Platypi-Medium.ttf",
      ),
    ),
    readFile(
      join(
        process.cwd(),
        "public",
        "fonts",
        "Platypi",
        "static",
        "Platypi-Light.ttf",
      ),
    ),
    readFile(join(process.cwd(), "public", "is.svg"), "base64"),
  ]);

  return new ImageResponse(
    <div
      style={{
        fontSize: 108,
        background: "#070b04",
        color: "#dbead3",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
        }}
      >
        <img
          src={`data:image/svg+xml;base64,${image}`}
          height={256}
          width={256}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            lineHeight: 0.6,
            marginLeft: 30,
            marginBottom: 30,
            letterSpacing: -2,
          }}
        >
          <div style={{ fontFamily: "Platypi", fontWeight: 500, opacity: 0.6 }}>
            a whisper
          </div>
          <div
            style={{
              fontFamily: "Platypi",
              fontWeight: 300,
              letterSpacing: 2,
            }}
          >
            a wave
          </div>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Platypi",
          data: headerFont,
          weight: 500,
          style: "normal",
        },
        {
          name: "Platypi",
          data: bodyFont,
          weight: 300,
          style: "normal",
        },
      ],
    },
  );
}
