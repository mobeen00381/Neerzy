import LegalLayout from '@/components/layout/LegalLayout';

export default function TermsPage() {
  const sections = [
    { id: 'acceptance', title: '1. Acceptance of Terms' },
    { id: 'service', title: '2. Description of Service' },
    { id: 'third-party', title: '3. Google & Third-Party Platforms' },
    { id: 'responsibilities', title: '4. User Responsibilities' },
    { id: 'reviews', title: '5. Review Requests Policy' },
    { id: 'billing', title: '6. Subscription & Billing' },
    { id: 'ip', title: '7. Intellectual Property' },
    { id: 'liability', title: '8. Limitation of Liability' },
    { id: 'termination', title: '9. Termination' },
  ];

  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="Please read these terms carefully before using Neerzy."
      lastUpdated={new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      sections={sections}
    >
      <section id="acceptance" className="mb-16">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using Neerzy (the "Platform", "Service", "we", "us"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
        </p>
        <p>
          You represent that you have the legal authority to enter into this agreement and that you will comply with all local, state, national, and international laws, including but not limited to those governing Google Business Profile policies and WhatsApp usage policies.
        </p>
      </section>

      <section id="service" className="mb-16">
        <h2>2. Description of Service</h2>
        <p>
          Neerzy is a content workflow and marketing assistance platform designed to simplify local business management. Our platform helps businesses:
        </p>
        <ul>
          <li>Create ready-to-post content drafts for search engines and social platforms.</li>
          <li>Organize marketing workflows and photo assets.</li>
          <li>Generate simple website updates and "before/after" showcases.</li>
          <li>Prepare professional review request messages for customer outreach.</li>
        </ul>
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 italic">
          <strong>Important:</strong> Neerzy is a productivity tool. We do not guarantee search engine rankings, customer reviews, lead generation volume, or specific business outcomes. The user remains solely responsible for the final publication of content and all communication with their customers.
        </div>
      </section>

      <section id="third-party" className="mb-16">
        <h2>3. Google & Third-Party Platforms</h2>
        <p>
          Neerzy is an independent platform and is <strong>not affiliated with, endorsed by, or a partner of Google or WhatsApp</strong>.
        </p>
        <p>
          Your use of the Platform often involves interaction with third-party services like Google Business Profile. You acknowledge that:
        </p>
        <ul>
          <li>Third-party platform functionality may change due to external API updates or policy changes outside of our control.</li>
          <li>You are responsible for complying with the rules and terms of service of these third-party platforms.</li>
          <li>Google, WhatsApp, and related trademarks belong to their respective owners.</li>
        </ul>
      </section>

      <section id="responsibilities" className="mb-16">
        <h2>4. User Responsibilities</h2>
        <p>As a user of Neerzy, you agree to use the Service ethically and legally. You shall not:</p>
        <ul>
          <li>Spam customers or send unsolicited communications.</li>
          <li>Attempt to generate or facilitate fake, fraudulent, or incentivized reviews.</li>
          <li>Upload illegal, defamatory, or copyrighted content that you do not own.</li>
          <li>Misuse messaging features to harass or impersonate other businesses or individuals.</li>
        </ul>
      </section>

      <section id="reviews" className="mb-16">
        <h2>5. Review Requests Policy</h2>
        <p>
          The Neerzy platform assists businesses with the workflow of requesting customer feedback. To protect both yourself and your customers, you agree that:
        </p>
        <ul>
          <li>You must obtain explicit customer consent before providing their contact details to the Platform or sending any messages.</li>
          <li>You are solely responsible for compliance with messaging laws such as GDPR, TCPA (USA), and CASL (Canada).</li>
          <li>You will not use the platform to offer incentives, payments, or discounts in exchange for positive reviews, as this violates most third-party platform policies.</li>
        </ul>
      </section>

      <section id="billing" className="mb-16">
        <h2>6. Subscription & Billing</h2>
        <p>
          Access to certain features requires a paid subscription. You agree to provide accurate billing information and authorize recurring payments where applicable.
        </p>
        <ul>
          <li>Pricing and plan features may change with reasonable notice.</li>
          <li>You may cancel your subscription at any time through your dashboard or by contacting support.</li>
          <li>We do not guarantee 100% uninterrupted service, though we strive for maximum uptime.</li>
          <li>Fair usage limits apply to AI generation and posting plans to ensure platform stability.</li>
        </ul>
      </section>

      <section id="ip" className="mb-16">
        <h2>7. Intellectual Property</h2>
        <p>
          Neerzy owns all rights, title, and interest in the Platform software, design, and proprietary algorithms.
        </p>
        <p>
          <strong>You own your content:</strong> You retain ownership of all text, photos, and assets you upload to the Platform. If you purchase a custom domain or website through our managed services, you retain ownership of those assets subject to any third-party registrar terms.
        </p>
      </section>

      <section id="liability" className="mb-16">
        <h2>8. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Neerzy shall not be liable for any indirect, incidental, or consequential damages, including but not limited to:
        </p>
        <ul>
          <li>Changes in Google search rankings or local visibility.</li>
          <li>Suspension or removal of your Google Business Profile or other social accounts.</li>
          <li>Loss of profits, revenue, or business opportunities.</li>
          <li>Outages or failures of third-party APIs (Google, WhatsApp, etc.).</li>
          <li>Reviews being removed or filtered by Google's automated systems.</li>
        </ul>
      </section>

      <section id="termination" className="mb-16">
        <h2>9. Termination</h2>
        <p>
          We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms, including but not limited to spamming, fraudulent activity, or abuse of the Service.
        </p>
      </section>
    </LegalLayout>
  );
}
