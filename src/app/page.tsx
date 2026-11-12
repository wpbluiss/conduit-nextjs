import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AnalyticsPageView } from "@/components/conduit/AnalyticsPageView";
import styles from "./portfolio.module.css";

export const metadata: Metadata = {
  title: "Conduit AI — Software, built with intent.",
  description: "Selected software and AI projects by Luis Garcia, founder of Conduit AI. Web applications, AI workflows, mobile experiences and interactive 3D.",
  alternates: { canonical: "https://conduitai.io" },
  openGraph: {
    title: "Conduit AI — Software, built with intent.",
    description: "Explore selected software and AI projects by Luis Garcia.",
    url: "https://conduitai.io", siteName: "Conduit AI", type: "website",
  },
  twitter: { card: "summary_large_image", title: "Conduit AI — Software, built with intent.", description: "Selected software and AI projects by Luis Garcia." },
};

const work = [
  { number: "01", name: "Praxis", category: "AI workspace", status: "Active development", description: "A workspace for AI conversations, tools and connected business workflows. Built around a Next.js interface with authenticated APIs and persistent conversation context.", stack: "Next.js · React · TypeScript · Supabase", href: "https://github.com/wpbluiss/conduit-nextjs", action: "Explore the source", kind: "praxis" },
  { number: "02", name: "Lunaro", category: "Insurance CRM", status: "In development", description: "An insurance CRM being built with a cofounder. Work spans the application interface, document workflows and AI-assisted retrieval over insurance knowledge.", stack: "React · Vite · Supabase · Vector search", href: "mailto:luis@conduitai.io?subject=Lunaro%20project%20walkthrough", action: "Request a walkthrough", kind: "lunaro" },
  { number: "03", name: "Conduit Mobile", category: "Mobile application", status: "Development build", description: "An Expo and React Native companion to the Conduit workspace, exploring how conversations and AI tools carry across web and mobile.", stack: "Expo · React Native · TypeScript", href: "https://github.com/wpbluiss/conduit-mobile", action: "Explore the source", kind: "mobile" },
  { number: "04", name: "Conduit HQ", category: "Interactive 3D", status: "Prototype", description: "A browser-based spatial workspace exploring navigation, rooms and interactive characters. An experiment in making software feel like a place.", stack: "Three.js · WebGPU · JavaScript", href: "https://github.com/wpbluiss/conduit-hq-3d", action: "Explore the source", kind: "spatial" },
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
        <nav aria-label="Main navigation"><a href="#work">Selected work</a><a href="#about">About</a><Link href="/auth/sign-in">Product sign in <Arrow /></Link></nav>
        <a className={styles.headerContact} href="mailto:luis@conduitai.io">Let’s talk <Arrow /></a>
      </header>

      <section className={styles.hero} aria-labelledby="hero-heading">
        <div className={styles.heroTop}><span className={styles.eyebrow}>Independent builder. Connected thinking.</span><span className={styles.location}>Based in South Florida / Working on the web</span></div>
        <h1 id="hero-heading">Software,<br />built with <em>intent.</em></h1>
        <div className={styles.heroBottom}>
          <p>I’m Luis Garcia, founder of Conduit AI. I build web applications, AI workflows and digital experiences—from the interface to the systems behind it.</p>
          <a className={styles.primary} href="#work">Explore selected work <span aria-hidden="true">↓</span></a>
        </div>
        <div className={styles.indexStrip}><span>01—04 / Selected projects</span><span>Web applications</span><span>AI systems</span><span>Mobile &amp; spatial</span></div>
      </section>

      <section id="work" className={styles.work} aria-labelledby="work-heading">
        <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>The work</span><h2 id="work-heading">Ideas made tangible.</h2></div><p>A selection of products and experiments.<br />Different surfaces. The same curiosity.</p></div>
        {work.map(project => <article key={project.number} className={styles.project}>
          <div className={`${styles.projectArt} ${styles[project.kind]}`} aria-hidden="true">
            <div className={styles.artCaption}><span>CONDUIT / {project.number}</span><span>{project.category}</span></div>
            {project.kind === "praxis" && <div className={styles.praxisArt}><span className={styles.orbitOne} /><span className={styles.orbitTwo} /><span className={styles.core}>p<span>raxis</span></span><div className={styles.artLabel}>Context. Tools. Conversation.</div></div>}
            {project.kind === "lunaro" && <div className={styles.lunaroArt}><span className={styles.fold}>L</span><span className={styles.lunaroWord}>lunaro</span><span className={styles.artLabel}>A clearer way to work.</span></div>}
            {project.kind === "mobile" && <div className={styles.mobileArt}><div className={styles.phone}><div className={styles.phoneNotch} /><span className={styles.phoneC}>c.</span><div className={styles.phoneLine} /><div className={styles.phoneLine} /><div className={styles.phoneBubble} /></div><span className={styles.mobileWord}>Thinking,<br />on the move.</span></div>}
            {project.kind === "spatial" && <div className={styles.spatialArt}><div className={styles.room}><span /><span /><span /><span /></div><span className={styles.spatialLabel}>A workspace.<br />Another dimension.</span></div>}
            <span className={styles.artNote}>Project identity study</span>
          </div>
          <div className={styles.projectInfo}><div className={styles.projectMeta}><span>{project.number} / {project.category}</span><span className={styles.status}>{project.status}</span></div><h3>{project.name}</h3><p>{project.description}</p><span className={styles.stack}>{project.stack}</span><a className={styles.projectLink} href={project.href}>{project.action} <Arrow /></a></div>
        </article>)}
        <p className={styles.projectFootnote}>Visuals are identity studies, not application screenshots. Source links show implementation; project status does not imply customer adoption or a public release.</p>
      </section>

      <section id="about" className={styles.about} aria-labelledby="about-heading"><div><span className={styles.eyebrow}>The person behind the work</span><h2 id="about-heading">Curiosity is the start.<br /><em>Building is the practice.</em></h2></div><div className={styles.aboutCopy}><p>I’m a hands-on builder drawn to the space between useful software and emerging technology. Conduit AI is where I bring those interests together.</p><p>My work spans product interfaces, APIs, AI integrations and interactive experiences. I use AI tools throughout the development process and focus on understanding how the pieces fit together.</p><a href="https://github.com/wpbluiss">See my public GitHub <Arrow /></a></div></section>
      <section className={styles.capabilities} aria-label="Areas of work"><span>Where I work</span><p>Product interfaces <i>/</i> APIs &amp; integrations <i>/</i> AI workflows <i>/</i> Mobile applications <i>/</i> Interactive 3D</p></section>
      <section id="contact" className={styles.contact} aria-labelledby="contact-heading"><span className={styles.eyebrow}>A conversation comes first</span><h2 id="contact-heading">What are you<br /><em>working on?</em></h2><div className={styles.contactBottom}><p>Have a product, a development role or a technical challenge in mind? Tell me a little about it.</p><a href="mailto:luis@conduitai.io">luis@conduitai.io <Arrow /></a></div></section>
      <footer className={styles.footer}><span>© {new Date().getFullYear()} Conduit AI LLC</span><a href="tel:+15614464520">(561) 446-4520</a><div><Link href="/legal/privacy">Privacy</Link><Link href="/legal/terms">Terms</Link><a href="https://github.com/wpbluiss">GitHub <Arrow /></a></div></footer>
    </main>
  );
}
