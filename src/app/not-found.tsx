import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found — Praxis",
};

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-4">
          404
        </p>
        <h1 className="text-4xl md:text-5xl font-semibold mb-4">
          Page not found
        </h1>
        <p className="text-[var(--color-text-muted)] max-w-sm mb-8">
          This page doesn&apos;t exist or has moved. Head back to where things are
          happening.
        </p>
        <Link href="/" className="btn-primary">
          Back to home
        </Link>
      </main>
      <Footer />
    </>
  );
}
