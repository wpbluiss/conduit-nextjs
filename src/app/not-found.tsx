import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-24 text-center"
        style={{ background: "var(--color-bg-canvas)" }}>
        <p className="text-sm font-mono tracking-widest uppercase mb-4"
          style={{ color: "var(--color-indigo-500)" }}>
          404
        </p>
        <h1 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight"
          style={{ color: "var(--color-ink-primary)" }}>
          Page not found
        </h1>
        <p className="text-base md:text-lg mb-10 max-w-md"
          style={{ color: "var(--color-ink-secondary)" }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
          style={{
            background: "var(--color-indigo-500)",
            color: "#fff",
          }}
        >
          Back to home
        </Link>
      </main>
      <Footer />
    </>
  );
}
