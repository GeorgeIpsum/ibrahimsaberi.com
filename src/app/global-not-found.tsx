import "./globals.css";

import { HistoryProvider } from "@/components/navigation/history-provider";
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
        <HistoryProvider>
          <div className="fixed flex h-screen w-screen">
            <NotFound />
          </div>
        </HistoryProvider>
      </body>
    </html>
  );
}
