import { Suspense } from "react";
import { LoadingText } from "@/components/text";
import { AuthProvider } from "./auth/auth-provider";

export default async function ComposePage() {
  return (
    <Suspense fallback={<LoadingText>mogging</LoadingText>}>
      <AuthProvider>
        <div className="flex flex-col gap-4">
          <p>Compose a new post.</p>
        </div>
      </AuthProvider>
    </Suspense>
  );
}
