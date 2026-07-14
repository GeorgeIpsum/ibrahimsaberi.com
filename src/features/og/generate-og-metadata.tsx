import type { Metadata } from "next";

export const generateOgMetadata = (
  route: string,
  alt?: string,
): Metadata["openGraph"] => {
  return {
    images: [
      {
        url: `/og/${route}.png`,
        width: 1200,
        height: 630,
        alt: alt || route,
      },
    ],
  };
};
