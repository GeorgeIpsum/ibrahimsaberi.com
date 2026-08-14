import type { Metadata } from "next";
import { ContactForm } from "@/features/contact/contact-form";
import { generateOgMetadata } from "@/features/og/generate-og-metadata";
export default function Page() {
  return <ContactForm />;
}

export const metadata: Metadata = {
  title: "get in touch",
  description: "but not too close",
  openGraph: generateOgMetadata("contact"),
};
