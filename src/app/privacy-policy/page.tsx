import LegalLayout from '@/components/layout/LegalLayout';

export default function PrivacyPage() {
  const sections = [
    { id: 'collection', title: '1. Information We Collect' },
    { id: 'usage', title: '2. How We Use Information' },
    { id: 'customer-data', title: '3. Customer Contact Data' },
    { id: 'security', title: '4. Data Storage & Security' },
    { id: 'rights', title: '5. GDPR & International Rights' },
    { id: 'cookies', title: '6. Cookies & Analytics' },
    { id: 'third-party', title: '7. Third-Party Services' },
    { id: 'retention', title: '8. Data Retention' },
  ];

  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="Your privacy matters to us. Learn how we handle your data."
      lastUpdated={new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      sections={sections}
    >
      <section id="collection" className="mb-16">
        <h2>1. Information We Collect</h2>
        <p>
          Neerzy collects only the information necessary to provide and improve our marketing workflow services. This includes:
        </p>
        <ul>
          <li><strong>Identity Data:</strong> Your name and email address.</li>
          <li><strong>Business Data:</strong> Business name, address, categories, and Google Business Profile details.</li>
          <li><strong>Content Assets:</strong> Job photos and job descriptions you upload.</li>
          <li><strong>Customer Contact Info:</strong> Phone numbers or emails you provide for the purpose of sending review requests.</li>
          <li><strong>Technical Data:</strong> IP address, browser type, and usage patterns on our website.</li>
        </ul>
      </section>

      <section id="usage" className="mb-16">
        <h2>2. How We Use Information</h2>
        <p>We use your information to deliver the Neerzy experience, specifically to:</p>
        <ul>
          <li>Generate AI-driven content drafts for your business.</li>
          <li>Synchronize your job photos with your website and Google profile.</li>
          <li>Manage your subscription and process payments.</li>
          <li>Provide customer support and technical troubleshooting.</li>
          <li>Execute review request workflows that you manually initiate.</li>
        </ul>
      </section>

      <section id="customer-data" className="mb-16">
        <h2>3. Customer Contact Data</h2>
        <p>
          When you use Neerzy to send review requests, you act as the Data Controller and we act as the Data Processor.
        </p>
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
          <strong>Important:</strong> You are responsible for ensuring you have a lawful basis (such as explicit consent) for providing any customer contact details to us. We process this data solely to deliver the messages you request and do not use it for our own marketing purposes.
        </div>
      </section>

      <section id="security" className="mb-16">
        <h2>4. Data Storage & Security</h2>
        <p>
          We implement industry-standard security measures to protect your data, including:
        </p>
        <ul>
          <li><strong>Encrypted Storage:</strong> Sensitive tokens and personal identifiers are encrypted at rest.</li>
          <li><strong>Secure Authentication:</strong> Multi-factor login support and secure session management.</li>
          <li><strong>Network Protection:</strong> Firewalls and monitoring to detect unauthorized access.</li>
        </ul>
        <p className="italic text-sm text-slate-500">
          While we use reasonable and appropriate security measures, no system is 100% secure. We cannot guarantee the absolute security of your data.
        </p>
      </section>

      <section id="rights" className="mb-16">
        <h2>5. GDPR & International Rights</h2>
        <p>
          Regardless of where you live, we support your rights to your data. Under regulations like GDPR (EU/UK), CCPA (USA), and CASL (Canada), you may request:
        </p>
        <ul>
          <li><strong>Access:</strong> A copy of the data we hold about you.</li>
          <li><strong>Correction:</strong> Updates to any inaccurate information.</li>
          <li><strong>Deletion:</strong> Removal of your account and associated data.</li>
        </ul>
        <p>To exercise these rights, please contact us at <a href="mailto:support@neerzy.com">support@neerzy.com</a>.</p>
      </section>

      <section id="cookies" className="mb-16">
        <h2>6. Cookies & Analytics</h2>
        <p>
          We use cookies to keep you logged in and to understand how you use our product. This includes:
        </p>
        <ul>
          <li><strong>Essential Cookies:</strong> Necessary for the website to function (e.g., authentication).</li>
          <li><strong>Analytics Cookies:</strong> Help us see which features are most used so we can improve them.</li>
        </ul>
        <p>You can manage your cookie preferences through your browser settings at any time.</p>
      </section>

      <section id="third-party" className="mb-16">
        <h2>7. Third-Party Services</h2>
        <p>
          We work with several trusted third-party providers to deliver our service, including:
        </p>
        <ul>
          <li><strong>Google:</strong> For Google Business Profile management.</li>
          <li><strong>WhatsApp (Meta):</strong> For messaging delivery.</li>
          <li><strong>Supabase:</strong> For secure database hosting.</li>
          <li><strong>Paddle:</strong> For payment processing and subscription management.</li>
        </ul>
        <p>These services maintain their own independent privacy policies, which we encourage you to review.</p>
      </section>

      <section id="retention" className="mb-16">
        <h2>8. Data Retention</h2>
        <p>
          We retain your information only as long as your account is active or as needed to provide you with the Service. We also retain and use your information to comply with our legal obligations, resolve disputes, and enforce our agreements.
        </p>
      </section>
    </LegalLayout>
  );
}
