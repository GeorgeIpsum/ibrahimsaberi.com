import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { waveCircle } from "@lucide/lab";
import { ImageResponse } from "next/og";
import { createElement } from "react";

export const alt = "whois I";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpenGraphImage() {
  const [lightFont, extraBoldFont, img] = await Promise.all([
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
    readFile(
      join(
        process.cwd(),
        "public",
        "fonts",
        "Platypi",
        "static",
        "Platypi-Bold.ttf",
      ),
    ),
    readFile(join(process.cwd(), "public", "is.svg"), "base64"),
  ]);

  return new ImageResponse(
    <div
      style={{
        fontSize: 108,
        background: "#461901",
        color: "#fffbeb",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Platypi",
        fontWeight: 400,
      }}
    >
      <svg
        color="currentColor"
        stroke="currentColor"
        width={256}
        height={256}
        viewBox="0 0 24 24"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.3"
        xmlns="http://www.w3.org/2000/svg"
      >
        {waveCircle.map(([tag, attrs]: [string, any]) =>
          createElement(tag, attrs),
        )}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 10,
          lineHeight: 0.8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 48,
            marginRight: 48,
          }}
        >
          <span>WHOIS</span>
          <span style={{ fontWeight: 800, color: "#FFFFEE" }}>i</span>
        </div>
        <div style={{ fontSize: 48 }}>look inwards</div>
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: 24,
          left: 24,
          width: 48,
          height: 48,
        }}
      >
        <img src={`data:image/svg+xml;base64,${img}`} width={48} height={48} />
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Platypi",
          data: lightFont,
          weight: 400,
          style: "normal",
        },
        {
          name: "Platypi",
          data: extraBoldFont,
          weight: 600,
          style: "normal",
        },
      ],
    },
  );
}
