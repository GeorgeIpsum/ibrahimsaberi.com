import { type NextRequest, NextResponse } from "next/server";

// THIS DOES NOT SEEM VERY SECURECHAMP BUT WHAT CAN YOU DOCHAMP
export const GET = async (request: NextRequest) => {
  const verifier = request.nextUrl.pathname.split("/").pop();
  if (!verifier) {
    return new Response("Missing verifier parameter", { status: 400 });
  }
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return new Response("Missing code parameter", { status: 400 });
  }

  const redirectUrl = new URL("/basin/compose/auth/callback", request.url);
  const ghUrl = new URL("https://github.com/login/oauth/access_token");
  ghUrl.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID ?? "");
  ghUrl.searchParams.set(
    "client_secret",
    process.env.GITHUB_CLIENT_SECRET ?? "",
  );
  ghUrl.searchParams.set("code", code);
  ghUrl.searchParams.set("redirect_uri", redirectUrl.toString());
  ghUrl.searchParams.set("code_verifier", verifier);

  const errors = [];
  let accessToken: string | null = null;
  try {
    const r = await fetch(ghUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    });

    const data = await r.json();
    if (!data.access_token) {
      errors.push("Missing access_token in response");
    } else {
      accessToken = data.access_token;
    }

    redirectUrl.searchParams.set("access_token", data.access_token);
  } catch (e) {
    errors.push(`Error fetching access token: ${e}`);
  }

  if (errors.length) {
    redirectUrl.searchParams.set("errors", JSON.stringify(errors));
  }

  const redirect = NextResponse.redirect(redirectUrl);

  if (accessToken) {
    redirect.cookies.set("gh_access_token", accessToken, {
      path: "/basin/compose",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
  }

  return redirect;
};
