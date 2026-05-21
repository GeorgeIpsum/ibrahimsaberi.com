import "@/css/globals.css";

import { NotFound } from "@/components/navigation/not-found";
import { fontBody, fontHeading, fontMono } from "@/css/font";
import { cn } from "@/css/lib";

export default function GlobalNotFound() {
  return (
    <html
      lang="en"
      data-theme="system"
      suppressHydrationWarning
      className={cn(fontBody.variable, fontHeading.variable, fontMono.variable)}
    >
      <body>
        <div className="fixed flex h-screen w-screen">
          <NotFound>
            You've found yourself in quite the precarious place. Return now.
          </NotFound>
        </div>
      </body>
    </html>
  );
}
