import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CEDA Innovation Portal | Citizen Entrepreneurial Development Agency",
  description:
    "Official digital innovation platform for Batswana youth entrepreneurs to submit, collaborate, and scale breakthrough ideas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning={true} className="flex min-h-screen flex-col bg-white text-ceda-body">
        <Providers>
          <a
            href="#main-content"
            className="sr-only z-50 rounded-md bg-white px-4 py-3 text-sm font-semibold text-ceda-burgundy shadow-md focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-3 focus:outline-ceda-orange"
          >
            Skip to main content
          </a>
          {children}
        </Providers>
      </body>
    </html>
  );
}
