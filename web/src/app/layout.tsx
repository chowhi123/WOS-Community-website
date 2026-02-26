import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import OnboardingCheck from "@/components/OnboardingCheck";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "WOS Community",
  description: "The Premier Community for WOS Players",
  icons: {
    icon: "/logo.svg"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 0.8,
  // maximumScale: 1, // Removed to allow user zooming
  // userScalable: false, // Removed to allow user zooming
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} ${outfit.variable}`}>
      <body className="bg-wos-bg text-slate-100 selection:bg-ice-500/30 overflow-x-hidden">
        <Providers>
          <OnboardingCheck />
          <Navbar />
          <div className="pt-4">
            {children}
          </div>
          <PwaInstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
