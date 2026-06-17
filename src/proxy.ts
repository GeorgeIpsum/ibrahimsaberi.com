import { type NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-next-path", request.nextUrl.pathname);

  if (request.nextUrl.pathname.startsWith("/basin/droplets")) {
    if (!request.cookies.get("droplets-path")) {
      return NextResponse.redirect(
        new URL("/basin/droplets/mirror", request.url),
        {
          headers,
        },
      );
    }
  }

  return NextResponse.next({
    request: {
      headers,
    },
  });
}
