import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
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
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased">
          <Providers>
            <TopBar />
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
