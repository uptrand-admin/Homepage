import { AboutSection } from "@/components/AboutSection";
import { BenefitsSection, JoinSection } from "@/components/BenefitsSection";
import { GamesSection } from "@/components/GamesSection";
import { Hero } from "@/components/Hero";
import { TimelineSection } from "@/components/TimelineSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <GamesSection />
      <AboutSection />
      <TimelineSection />
      <BenefitsSection />
      <JoinSection />
    </>
  );
}
