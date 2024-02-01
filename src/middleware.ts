import { type NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const headers = request.headers.entries();
  const logged: Record<string, string> = {};
  for (const [header, val] of headers) {
    if (!logged[header]) {
      logged[header] = val;
      console.log(header, val);
    }
  }
  return NextResponse.next();
}
