import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'Blog — Conduit AI',
  description: 'Tips, insights, and strategies for service businesses to capture more leads and grow revenue.',
};

const posts = [
  {
    slug: 'why-service-businesses-miss-calls',
    title: 'Why Service Businesses Miss 62% of Calls (And How to Fix It)',
    excerpt: 'Every missed call is a missed opportunity. Here\'s why it happens and what you can do about it today.',
    date: '2026-02-20',
    readTime: '5 min',
  },
  {
    slug: 'ai-receptionist-vs-answering-service',
    title: 'AI Receptionist vs. Answering Service: Which Is Right for You?',
    excerpt: 'Compare costs, quality, and ROI between traditional answering services and AI-powered alternatives.',
    date: '2026-02-18',
    readTime: '7 min',
  },
  {
    slug: 'hvac-lead-recovery',
    title: 'How HVAC Companies Lose $120K/Year to Missed Calls',
    excerpt: 'The math behind missed calls in the HVAC industry — and how one company recovered 40% of lost leads.',
    date: '2026-02-15',
    readTime: '6 min',
  },
  {
    slug: 'salon-booking-automation',
    title: 'Salon Booking Automation: Stop Losing Clients to Voicemail',
    excerpt: 'Your clients won\'t wait on hold. Here\'s how smart salons capture every booking request automatically.',
    date: '2026-02-12',
    readTime: '5 min',
  },
  {
    slug: 'small-business-phone-stats',
    title: '10 Phone Statistics Every Small Business Owner Needs to Know',
    excerpt: 'The data is clear: your phone is your most important sales tool. Are you using it right?',
    date: '2026-02-10',
    readTime: '4 min',
  },
];

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-16">
            <span className="section-label">Blog</span>
            <h1 className="font-[var(--font-heading)] text-4xl md:text-5xl font-black mt-4 mb-4">
              Insights for <span className="text-gradient">service businesses</span>
            </h1>
            <p className="text-brand-text-muted text-lg">
              Tips, strategies, and data to help you capture more leads and grow your business.
            </p>
          </div>

          <div className="space-y-6">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="glass-card p-6 md:p-8 hover:border-brand-cyan/30 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3 text-sm text-brand-text-dim mb-3">
                  <time>{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
                  <span>·</span>
                  <span>{post.readTime} read</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold mb-2 group-hover:text-brand-cyan transition-colors">
                  {post.title}
                </h2>
                <p className="text-brand-text-muted">{post.excerpt}</p>
              </article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
