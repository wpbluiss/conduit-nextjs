import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AnalyticsPageView } from "@/components/conduit/AnalyticsPageView";
import styles from "./portfolio.module.css";

const description = "Custom software, AI integrations and automation. Contact Luis Garcia at Conduit AI.";
export const metadata: Metadata = {
  title: "Conduit AI | Software development",
  description,
  alternates: { canonical: "https://conduitai.io" },
  openGraph: { title: "Conduit AI | Software development", description, url: "https://conduitai.io", siteName: "Conduit AI", type: "website" },
  twitter: { card: "summary_large_image", title: "Conduit AI | Software development", description },
};

const services = [
  { name: "Custom software", description: "Web applications, customer portals and internal tools. Build something new or make changes to software you already have.", examples: "Dashboards, forms, account management, databases and APIs." },
  { name: "AI integrations", description: "Add AI features to an application or an existing business process.", examples: "Search documents, extract information from files and draft content for review." },
  { name: "Automation", description: "Connect applications and handle tasks that would otherwise require copying information or updating records by hand.", examples: "Sync records, send notifications and generate reports." },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <AnalyticsPageView />
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Conduit AI home"><Image src="/conduit-logo.svg" width={34} height={34} alt="" priority /><span>conduit<span className={styles.brandAI}>ai</span></span></Link>
        <nav aria-label="Main navigation"><a href="#services">Services</a><a href="#about">About</a><a href="#contact">Contact</a></nav>
      </header>

      <section className={styles.hero} aria-labelledby="hero-heading">
        <p className={styles.location}>Luis Garcia · South Florida</p>
        <h1 id="hero-heading">Software development<br />&amp; AI integrations.</h1>
        <p className={styles.intro}>I build web applications, connect software systems and automate repetitive tasks.</p>
        <a className={styles.primary} href="mailto:luis@conduitai.io">Email Luis</a>
        <a className={styles.secondary} href="#services">View services</a>
      </section>

      <section id="services" className={styles.services} aria-labelledby="services-heading">
        <h2 id="services-heading">Services</h2>
        <div>{services.map(service => <article key={service.name} className={styles.service}><h3>{service.name}</h3><div><p>{service.description}</p><p className={styles.examples}>{service.examples}</p></div></article>)}</div>
      </section>

      <section id="about" className={styles.about} aria-labelledby="about-heading">
        <h2 id="about-heading">About</h2>
        <div><p>I’m Luis Garcia, founder of Conduit AI. I’m based in South Florida and work across web development, APIs and AI integrations.</p><p>Before proposing a scope, I’ll ask about the task, your existing systems and what you need the software to do.</p><a href="https://github.com/wpbluiss">GitHub</a></div>
      </section>

      <section id="contact" className={styles.contact} aria-labelledby="contact-heading">
        <h2 id="contact-heading">Contact Luis</h2>
        <p>Send a short description of what you need built or fixed.</p>
        <a href="mailto:luis@conduitai.io">luis@conduitai.io</a>
        <a className={styles.phone} href="tel:+15614464520">(561) 446-4520</a>
      </section>
      <footer className={styles.footer}><span>© {new Date().getFullYear()} Conduit AI LLC</span><div><Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link></div></footer>
    </main>
  );
}
