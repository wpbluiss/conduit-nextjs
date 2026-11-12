import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AnalyticsPageView } from "@/components/conduit/AnalyticsPageView";
import styles from "./portfolio.module.css";

export const metadata: Metadata = {
  title: "Conduit AI — Software, built with intent.",
  description: "Custom software development, AI integrations and workflow automation. Work directly with Luis Garcia, founder of Conduit AI.",
  alternates: { canonical: "https://conduitai.io" },
  openGraph: {
    title: "Conduit AI — Software, built with intent.",
    description: "Custom software, AI integrations and workflow automation.",
    url: "https://conduitai.io", siteName: "Conduit AI", type: "website",
  },
  twitter: { card: "summary_large_image", title: "Conduit AI — Software, built with intent.", description: "Custom software, AI integrations and workflow automation." },
};

const services = [
  { number: "01", name: "Custom software", word: "Build.", category: "Make the right tool", description: "Web applications, internal tools and business systems shaped around how you work. From a new idea to improving an existing application.", detail: "Web applications · Internal tools · APIs", tone: "build" },
  { number: "02", name: "AI integrations", word: "Connect.", category: "Put AI to work", description: "Bring AI into the software and workflows you already use. Explore document processing, knowledge search and assisted tasks with a clear purpose.", detail: "Document workflows · Knowledge retrieval · AI features", tone: "connect" },
  { number: "03", name: "Workflow automation", word: "Simplify.", category: "Make the pieces work together", description: "Connect your tools, move information between systems and reduce repetitive steps. Start with the tasks that take time away from your actual work.", detail: "System integrations · Data handoffs · Repetitive tasks", tone: "simplify" },
];

function Arrow() {
  return <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", flexShrink: 0, verticalAlign: "middle" }}><path d="M3 13 13 3M3 3h10v10" stroke="currentColor" strokeWidth="1.4" /></svg>;
}

export default function Home() {
  return (
    <main className={styles.page}>
      <AnalyticsPageView />
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({"@context":"https://schema.org","@type":"Organization",name:"Conduit AI",url:"https://conduitai.io",logo:"https://conduitai.io/conduit-logo.svg",founder:{"@type":"Person",name:"Luis Garcia"},description:"Software and AI product development."})}} />
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Conduit AI home"><Image src="/conduit-logo.svg" width={36} height={36} alt="" priority /><span>conduit<span className={styles.brandAI}>ai</span></span></Link>
        <nav aria-label="Main navigation"><a href="#services">Services</a><a href="#about">About</a><a href="#contact">Contact</a></nav>
        <a className={styles.headerContact} href="mailto:luis@conduitai.io">Let’s talk <Arrow /></a>
      </header>

      <section className={styles.hero} aria-labelledby="hero-heading">
        <div className={styles.heroTop}><span className={styles.eyebrow}>Software. AI. Automation.</span><span className={styles.location}>Based in South Florida / Open to collaboration</span></div>
        <h1 id="hero-heading">Software,<br />built with <em>intent.</em></h1>
        <div className={styles.heroBottom}>
          <p>Custom software, AI integrations and automation for the way you work. Work directly with me, Luis Garcia, to turn a business need into a practical technical solution.</p>
          <a className={styles.primary} href="#services">Explore what we can build <span aria-hidden="true">↓</span></a>
        </div>
        <div className={styles.indexStrip}><span>Built around your needs</span><span>Custom software</span><span>AI integrations</span><span>Workflow automation</span></div>
      </section>

      <section id="services" className={styles.work} aria-labelledby="services-heading">
        <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>How I can help</span><h2 id="services-heading">Useful technology.<br />A clear purpose.</h2></div><p>Start with the problem.<br />Then choose what needs building.</p></div>
        {services.map(service => <article key={service.number} className={styles.project}>
          <div className={`${styles.serviceArt} ${styles[service.tone]}`} aria-hidden="true"><div className={styles.artCaption}><span>CONDUIT / {service.number}</span><span>{service.category}</span></div><span className={styles.serviceWord}>{service.word}</span><span className={styles.artNote}>Software, built with intent.</span></div>
          <div className={styles.projectInfo}><span className={styles.projectMeta}>{service.number} / {service.category}</span><h3>{service.name}</h3><p>{service.description}</p><span className={styles.stack}>{service.detail}</span><a className={styles.projectLink} href="mailto:luis@conduitai.io">Discuss your needs <Arrow /></a></div>
        </article>)}
      </section>

      <section id="about" className={styles.about} aria-labelledby="about-heading"><div><span className={styles.eyebrow}>The person behind the work</span><h2 id="about-heading">Your goals first.<br /><em>The technology follows.</em></h2></div><div className={styles.aboutCopy}><p>I’m Luis Garcia, founder of Conduit AI. I work hands-on across interfaces, APIs and AI integrations, bringing the pieces together around a practical business need.</p><p>We begin with a conversation about what you need, what you already have and where the friction is. From there, we can decide whether there’s a fit and agree on the right next step.</p><a href="https://github.com/wpbluiss">Explore my development work <Arrow /></a></div></section>
      <section className={styles.capabilities} aria-label="Areas of work"><span>Where I work</span><p>Understand the need <i>/</i> Choose an approach <i>/</i> Build &amp; refine</p></section>
      <section id="contact" className={styles.contact} aria-labelledby="contact-heading"><span className={styles.eyebrow}>A conversation comes first</span><h2 id="contact-heading">What are you<br /><em>working on?</em></h2><div className={styles.contactBottom}><p>Have a product, a development role or a technical challenge in mind? Tell me a little about it.</p><a href="mailto:luis@conduitai.io">luis@conduitai.io <Arrow /></a></div></section>
      <footer className={styles.footer}><span>© {new Date().getFullYear()} Conduit AI LLC</span><a href="tel:+15614464520">(561) 446-4520</a><div><Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link><a href="https://github.com/wpbluiss">GitHub <Arrow /></a></div></footer>
    </main>
  );
}
