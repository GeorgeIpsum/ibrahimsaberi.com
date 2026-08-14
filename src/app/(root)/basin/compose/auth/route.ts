import { createHash, randomBytes } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";

export const GET = (request: NextRequest) => {
  const url = new URL("https://github.com/login/oauth/authorize");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  url.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID ?? "");

  // this is.... Not A Good Idea Methinks....
  url.searchParams.set(
    "redirect_uri",
    new URL(`/basin/compose/auth/callback/${verifier}`, request.url).toString(),
  );
  url.searchParams.set("login", "GeorgeIpsum");
  url.searchParams.set("scope", "read:user user:email repo");
  url.searchParams.set("state", randomBytes(64).toString("hex"));

  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("allow_signup", "false");

  return NextResponse.redirect(url);
};
