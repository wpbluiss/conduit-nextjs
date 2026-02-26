export const metadata = {
  title: 'Privacy Policy — Conduit AI',
  description: 'How Conduit AI collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="max-w-3xl mx-auto px-6 py-32">
        <p className="text-sm font-mono tracking-widest text-[var(--cyan)] mb-4">LEGAL</p>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-[var(--muted)] mb-12">Last updated: February 25, 2026</p>

        <div className="space-y-10 text-[var(--muted)] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">1. Introduction</h2>
            <p>
              Conduit AI LLC (&quot;Conduit AI,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the website
              conduitai.io and provides AI-powered lead recovery services for service businesses.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you visit our website or use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">2. Information We Collect</h2>
            <p className="mb-3">We may collect the following types of information:</p>
            <p className="mb-2">
              <strong className="text-[var(--text)]">Personal Information:</strong> Name, email address, phone number,
              business name, and business address that you voluntarily provide when signing up for
              our service, requesting a demo, or contacting us.
            </p>
            <p className="mb-2">
              <strong className="text-[var(--text)]">Call Data:</strong> When our AI voice agent answers calls on behalf
              of your business, we collect caller information including phone numbers, names, and
              the content of conversations to provide our lead capture service.
            </p>
            <p className="mb-2">
              <strong className="text-[var(--text)]">Usage Data:</strong> We automatically collect certain information when
              you visit our website, including IP address, browser type, operating system, referring
              URLs, and pages viewed.
            </p>
            <p>
              <strong className="text-[var(--text)]">Payment Information:</strong> Payment details are processed securely
              through Stripe. We do not store your full credit card number on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <p className="mt-2">
              Provide, operate, and maintain our AI lead recovery service; process transactions and
              send related information; send you notifications about captured leads; respond to your
              comments, questions, and support requests; monitor and analyze usage trends to improve
              our service; detect, prevent, and address technical issues and fraud; and comply with
              legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">4. How We Share Your Information</h2>
            <p>
              We do not sell your personal information. We may share information with third-party
              service providers who assist us in operating our service (such as Stripe for payments,
              Twilio for telephony, and Vapi.ai for voice AI). These providers are contractually
              obligated to protect your information. We may also disclose information if required by
              law or to protect our rights and safety.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">5. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your information,
              including encryption in transit (TLS/SSL) and at rest. However, no method of
              transmission over the Internet is 100% secure, and we cannot guarantee absolute
              security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">6. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed
              to provide our services. Call recordings and lead data are retained for the duration of
              your subscription. You may request deletion of your data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">7. Your Rights</h2>
            <p>
              Depending on your location, you may have the right to access, correct, or delete your
              personal information; opt out of marketing communications; request a copy of your data;
              and withdraw consent where applicable. To exercise these rights, contact us at
              support@conduitai.io.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">8. Cookies and Tracking</h2>
            <p>
              Our website uses cookies and similar tracking technologies to enhance your experience
              and analyze site traffic. We use Vercel Analytics for website performance monitoring.
              You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">9. Children&apos;s Privacy</h2>
            <p>
              Our services are not directed to individuals under the age of 18. We do not knowingly
              collect personal information from children. If you believe we have collected
              information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by posting the new policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[var(--text)] mb-3">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, contact us at:
            </p>
            <p className="mt-2">
              Conduit AI LLC<br />
              Email: support@conduitai.io<br />
              Phone: (561) 446-4520
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
