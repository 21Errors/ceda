import type { ReactNode } from "react";
import { GlobalSupportActions } from "@/components/GlobalSupportActions";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";

export default function LandingPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell flex min-h-screen flex-col bg-white">
      <Navbar />
      <div className="flex flex-1 flex-col">{children}</div>
      <Footer />
      <GlobalSupportActions />
    </div>
  );
}
