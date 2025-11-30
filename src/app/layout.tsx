import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppProvider } from "@/providers/AppProvider";
import { AuthGuard } from "@/components/organisms/AuthGuard";
import { EventDebugger } from "@/components/organisms/EventDebugger";
import { AIDebugger } from "@/components/organisms/AIDebugger";
import { MigrationPrompt } from "@/components/organisms/MigrationPrompt";
import { Toaster } from "sonner";
import "./globals.css";

import { Caveat } from "next/font/google";
import { cn } from "@/lib/utils";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const caveat = Caveat({
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  title: "Notes.Ooozzy - Fast, Playful Notes",
  description:
    "A delightful notes app with instant capture, visual organization, and smart features",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          caveat.variable,
          "antialiased"
        )}
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124, 65, 254, 0.05), transparent),
            radial-gradient(ellipse 80% 50% at 80% 80%, rgba(124, 65, 254, 0.05), transparent),
            radial-gradient(ellipse 80% 50% at 20% 80%, rgba(124, 65, 254, 0.05), transparent),
            linear-gradient(to bottom, white, #fafafa)
          `,
          backgroundSize: "100% 100%, 100% 100%, 100% 100%, 100% 100%",
          backgroundPosition: "0 0, 0 0, 0 0, 0 0",
          backgroundAttachment: "fixed",
          minHeight: "100vh",
        }}
      >
        <AppProvider>
          <AuthGuard>
            {children}
            <MigrationPrompt />
            {process.env.NODE_ENV === "development" && (
              <>
                <EventDebugger />
                <AIDebugger />
              </>
            )}
          </AuthGuard>
          <Toaster position="bottom-right" richColors expand={true} />
        </AppProvider>
      </body>
    </html>
  );
}
