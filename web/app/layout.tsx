import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Providers } from "./providers";
import { TopBar } from "@/components/top-bar";

export const metadata: Metadata = {
  title: "TaskMarket",
  description: "A two-sided task marketplace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <html lang="en">
        <body className="antialiased">
          <Providers>
            <TopBar />
            {children}
          </Providers>
        </body>
      </html>
    </AuthProvider>
  );
}
