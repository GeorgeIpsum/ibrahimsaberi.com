import { type NextRequest, NextResponse, userAgent } from "next/server";
import { validateReflection } from "@/features/reflection";

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-next-path", request.nextUrl.pathname);

  if (request.nextUrl.pathname.startsWith("/basin/droplets")) {
    if (
      process.env.NODE_ENV === "development" &&
      process.env.SKIP_DROPLET_VERIFICATION
    ) {
      console.warn(
        "Droplet verification is disabled in development mode. This should not be used in production.",
      );
      return NextResponse.next({
        request: {
          headers,
        },
      });
    }

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
