import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductTiles from "@/components/ProductTiles";
import Story from "@/components/Story";
import Vision from "@/components/Vision";
import Pricing from "@/components/Pricing";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <ProductTiles />
      <Story />
      <Vision />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}
