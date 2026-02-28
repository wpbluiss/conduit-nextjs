export default function sitemap() {
  const baseUrl = 'https://conduitai.io';

  const blogSlugs = [
    'after-hours-call-answering-small-business',
    'ai-lead-scoring-service-businesses',
    'ai-receptionist-vs-voicemail',
    'answering-service-vs-ai-receptionist-cost',
    'bilingual-answering-service-spanish',
    'call-forwarding-setup-ai-receptionist',
    'dental-office-missed-calls-patients',
    'dental-practice-missed-appointments',
    'electrician-answering-service-alternative',
    'electrician-emergency-calls-after-hours',
    'first-response-wins-lead-response-time',
    'google-reviews-automated-after-service',
    'google-reviews-automation-service-business',
    'how-plumbers-lose-revenue-missed-calls',
    'hvac-summer-call-volume',
    'lead-scoring-service-business',
    'med-spa-client-booking-ai',
    'missed-call-cost-small-business',
    'pest-control-lead-capture-seasons',
    'plumber-answering-phone-on-job-site',
    'roofing-company-lead-generation-ai',
    'roofing-leads-after-storm-season',
    'salon-no-show-rate-fix',
    'sentiment-analysis-customer-calls',
    'solo-contractor-ai-receptionist',
  ];

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...blogSlugs.map((slug) => ({
      url: `${baseUrl}/blog/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    })),
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
