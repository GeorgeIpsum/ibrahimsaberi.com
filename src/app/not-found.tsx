import { HFNotFound } from "@/components/navigation/hf-not-found";
import { HFLayout } from "@/components/structure/hf-layout";
import "@/css/globals.css";

export default function NotFound() {
  return (
    <HFLayout>
      <HFNotFound>
        You've found yourself in quite the precarious place. Return now.
      </HFNotFound>
    </HFLayout>
  );
}
