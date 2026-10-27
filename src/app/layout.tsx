import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./globals.css";
import { DemoStoreProvider } from "@/lib/store";
import { SupabaseSyncProvider } from "@/components/supabase-sync-provider";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "AssetSentinel AI — Industrial Inspection Reporting (Demo)",
  description:
    "Demo MVP for industrial roof and building-exterior inspection reporting in Malaysia. All data is fictional demo data; no real AI is connected.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <DemoStoreProvider>
          <SupabaseSyncProvider>
            <AppShell>{children}</AppShell>
          </SupabaseSyncProvider>
        </DemoStoreProvider>
      </body>
    </html>
  );
}
