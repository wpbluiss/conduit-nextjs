"use client";

import Navbar from "@/components/Navbar";
import ScrollExperience from "@/components/ScrollExperience";
import Footer from "@/components/Footer";

export default function PageContent() {
  return (
    <>
      <Navbar />
      <main>
        <ScrollExperience />
      </main>
      <Footer />
    </>
  );
}
