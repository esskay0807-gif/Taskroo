import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Providers } from "./providers";
import { TopBar } from "@/components/top-bar";
import { Footer } from "@/components/footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Taskroo — post a task, get it done",
  description:
    "Taskroo is a task marketplace. Post a task, receive offers from trusted taskers, chat, and pay securely.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <html lang="en" className={inter.variable}>
        <body className="min-h-screen bg-background font-sans antialiased">
          <Providers>
            <div className="flex min-h-screen flex-col">
              <TopBar />
              <div className="flex-1">{children}</div>
              <Footer />
            </div>
          </Providers>
        </body>
      </html>
    </AuthProvider>
  );
}
