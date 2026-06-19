import { type NextRequest, NextResponse, userAgent } from "next/server";
import { validateReflection } from "./services/reflection/validate";

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-next-path", request.nextUrl.pathname);

  if (request.nextUrl.pathname.startsWith("/basin/droplets")) {
    const ua = userAgent(request);
    const reflectionCookie = request.cookies.get("reflection");
    const isValid =
      reflectionCookie && validateReflection(reflectionCookie.value);

    if (!isValid || ua.isBot) {
      const params = new URLSearchParams();
      params.set("reason", !isValid ? "penance" : "pontification");
      const url = new URL("/reflection", request.url);
      url.search = params.toString();
      return NextResponse.redirect(url, {
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
