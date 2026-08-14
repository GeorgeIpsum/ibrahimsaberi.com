import { Suspense } from "react";
import Challenge from "./challenge";
export default async function ChallengeStatusPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Challenge searchParams={searchParams} />
    </Suspense>
  );
}
