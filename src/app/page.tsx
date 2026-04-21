import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import LiveAgentGrid from "@/components/LiveAgentGrid";
import Constellation from "@/components/Constellation";
import Departments from "@/components/Departments";
import Story from "@/components/Story";
import Terminal from "@/components/Terminal";
import CaseStudy from "@/components/CaseStudy";
import Pricing from "@/components/Pricing";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <LiveAgentGrid />
      <Constellation />
      <Departments />
      <Story />
      <Terminal />
      <CaseStudy />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}
