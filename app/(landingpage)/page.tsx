import { HeroSection } from "@/components/landing/HeroSection";
import { WhySubmitSection } from "@/components/landing/WhySubmitSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { ProcessSection } from "@/components/landing/ProcessSection";
import { ShowcaseSection } from "@/components/landing/ShowcaseSection";
import { NewsSection } from "@/components/landing/NewsSection";
import { PortalCtaSection } from "@/components/landing/PortalCtaSection";

export default function Home() {
  return (
    <main id="main-content" className="flex-1 bg-white">
      <HeroSection />
      <WhySubmitSection />
      <BenefitsSection />
      <ProcessSection />
      <ShowcaseSection />
      <NewsSection />
      <PortalCtaSection />
    </main>
  );
}
