import { HFNotFound } from "@/components/navigation/hf-not-found";
import { HFPage } from "@/components/structure/hf-page";
import "@/css/globals.css";

export default function NotFound() {
  return (
    <HFPage>
      <HFNotFound>
        You've found yourself in quite the precarious place. Return now.
      </HFNotFound>
    </HFPage>
  );
}
