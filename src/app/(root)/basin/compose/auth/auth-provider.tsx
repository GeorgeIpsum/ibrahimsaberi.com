import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { use } from "react";
export const AuthProvider: React.FC<React.PropsWithChildren> = async ({
  children,
}) => {
  await connection();
  const cookieStore = await cookies();
  const ghCookie = cookieStore.get("gh_access_token");

  if (!ghCookie) {
    redirect("/basin/compose/auth");
  }

  // check if gh cookie is valid
  const userPromise = fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${ghCookie.value}`,
      Accept: "application/vnd.github+json",
    },
  }).then((res) => res.json());

  const user = use(userPromise);

  if (!user) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};
