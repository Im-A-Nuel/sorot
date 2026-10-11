import { Hero } from "@/components/Hero";
import { Faq } from "@/components/sections/Faq";
import { Footer } from "@/components/sections/Footer";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Install } from "@/components/sections/Install";
import { Matching } from "@/components/sections/Matching";
import { PantaApi } from "@/components/sections/PantaApi";
import { Security } from "@/components/sections/Security";
import { TrustBar } from "@/components/sections/TrustBar";

export default function Page() {
  return (
    <main id="content">
      <Hero />
      <div className="relative overflow-hidden bg-[#eef0fd]">
        <div aria-hidden="true" className="page-glow" />
        <div className="grain" aria-hidden="true" />
        <div className="relative">
          <TrustBar />
          <HowItWorks />
          <Matching />
          <Security />
          <PantaApi />
          <Install />
          <Faq />
          <Footer />
        </div>
      </div>
    </main>
  );
}
