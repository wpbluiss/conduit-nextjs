import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductTiles from "@/components/ProductTiles";
import Cinematic from "@/components/Cinematic";
import Vision from "@/components/Vision";
import Customers from "@/components/Customers";
import EngineeringProof from "@/components/EngineeringProof";
import Pricing from "@/components/Pricing";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <ProductTiles />
      <Cinematic />
      <Vision />
      <Customers />
      <EngineeringProof />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}
