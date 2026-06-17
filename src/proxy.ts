import { type NextRequest, NextResponse, userAgent } from "next/server";

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-next-path", request.nextUrl.pathname);

  if (request.nextUrl.pathname.startsWith("/basin/droplets")) {
    const ua = userAgent(request);
    const reflectionCookie = request.cookies.get("droplets-path");
    if (!reflectionCookie || ua.isBot) {
      return NextResponse.redirect(new URL("/reflection", request.url), {
        headers,
      });
    }
  }

  return NextResponse.next({
    request: {
      headers,
    },
  });
}
