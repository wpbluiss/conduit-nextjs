"use client";

import SmoothScroll from "@/components/SmoothScroll";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Terminal from "@/components/Terminal";
import DepartmentGrid from "@/components/DepartmentGrid";
import FounderStory from "@/components/FounderStory";
import WaitlistCTA from "@/components/WaitlistCTA";
import Footer from "@/components/Footer";

export default function PageContent() {
  return (
    <SmoothScroll>
      <Navbar />
      <main>
        <Hero />
        <Terminal />
        <DepartmentGrid />
        <FounderStory />
        <WaitlistCTA />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
