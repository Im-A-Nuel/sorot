import { Hero } from "@/components/Hero";
import { Faq } from "@/components/sections/Faq";
import { Features } from "@/components/sections/Features";
import { Footer } from "@/components/sections/Footer";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Journey } from "@/components/sections/Journey";
import { Install } from "@/components/sections/Install";
import { Matching } from "@/components/sections/Matching";
import { PantaApi } from "@/components/sections/PantaApi";
import { Problem } from "@/components/sections/Problem";
import { Security } from "@/components/sections/Security";
import { TradeFlow } from "@/components/sections/TradeFlow";
import { TrustBar } from "@/components/sections/TrustBar";

export default function Page() {
  return (
    <main id="content">
      <Hero />
      <div className="relative -mt-8 overflow-hidden rounded-t-[36px] bg-[#eef0fd] md:-mt-12 md:rounded-t-[56px]">
        <div aria-hidden="true" className="page-glow" />
        <div className="grain" aria-hidden="true" />
        <div className="relative">
          <TrustBar />
          <Journey />
          <Problem />
          <HowItWorks />
          <Matching />
          <TradeFlow />
          <Features />
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
