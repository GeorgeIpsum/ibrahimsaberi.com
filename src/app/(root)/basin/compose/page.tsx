import { Suspense } from "react";
import { Spinner } from "@/components/atoms/spinner";
import { AuthProvider } from "./auth/auth-provider";

export default async function ComposePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-16rem)] w-full items-center justify-center gap-2 text-muted-foreground">
          <Spinner className="size-4" />
          Loading...
        </div>
      }
    >
      <AuthProvider>
        <div className="flex flex-col gap-4">
          <p>Compose a new post.</p>
        </div>
      </AuthProvider>
    </Suspense>
  );
}
