import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { IconNode } from "lucide-react";
import { ImageResponse } from "next/og";
import { createElement } from "react";

export const size = {
  width: 1200,
  height: 630,
};

interface CreateOgOpts {
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  icon: IconNode;
  backgroundColor?: `#${string}`;
  color?: `#${string}`;
}
export const createOgImage = async ({
  title,
  subtitle,
  icon,
  backgroundColor,
  color,
}: CreateOgOpts) => {
  const [lightFont, extraBoldFont, img, monoFont] = await Promise.all([
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
    readFile(
      join(
        process.cwd(),
        "public",
        "fonts",
        "CascadiaMono",
        "static",
        "CascadiaMono-Regular.ttf",
      ),
    ),
  ]);

  return new ImageResponse(
    <div
      style={{
        fontSize: 108,
        background: backgroundColor ?? "#070b04",
        color: color ?? "#dbead3",
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
        {icon.map(([tag, attrs]: [string, any]) => createElement(tag, attrs))}
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
          {typeof title === "string" ? <span>{title}</span> : title}
        </div>
        {subtitle &&
          (typeof subtitle === "string" ? (
            <div style={{ fontSize: 48 }}>{subtitle}</div>
          ) : (
            subtitle
          ))}
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
      // The route is dynamic (satori renders per request), so caching has to
      // happen at the HTTP layer: s-maxage lets Vercel's CDN serve the PNG
      // after the first render, and the deploy-time cache purge keeps it from
      // ever going stale relative to the committed sauce.
      headers: {
        "Cache-Control":
          "public, max-age=3600, s-maxage=31536000, stale-while-revalidate=86400",
      },
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
        {
          name: "monospace",
          data: monoFont,
          weight: 400,
          style: "normal",
        },
      ],
    },
  );
};
