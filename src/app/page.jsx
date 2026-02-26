import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Problem from '@/components/Problem';
import HowItWorks from '@/components/HowItWorks';
import Demo from '@/components/Demo';
import Industries from '@/components/Industries';
import Founding from '@/components/Founding';
import Pricing from '@/components/Pricing';
import Calculator from '@/components/Calculator';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Demo />
        <Industries />
        <Founding />
        <Pricing />
        <Calculator />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
