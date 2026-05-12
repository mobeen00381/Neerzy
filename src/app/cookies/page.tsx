import LegalLayout from '@/components/layout/LegalLayout';

export default function CookiesPage() {
  const sections = [
    { id: 'what-are-cookies', title: '1. What Are Cookies?' },
    { id: 'how-we-use', title: '2. How We Use Cookies' },
    { id: 'types', title: '3. Types of Cookies We Use' },
    { id: 'choices', title: '4. Your Choices' },
  ];

  return (
    <LegalLayout
      title="Cookie Policy"
      subtitle="How we use cookies to improve your Neerzy experience."
      lastUpdated={new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      sections={sections}
    >
      <section id="what-are-cookies" className="mb-16">
        <h2>1. What Are Cookies?</h2>
        <p>
          Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used by website owners to make their websites work, or work more efficiently, as well as to provide reporting information.
        </p>
      </section>

      <section id="how-we-use" className="mb-16">
        <h2>2. How We Use Cookies</h2>
        <p>
          Neerzy uses cookies for several reasons. Some cookies are required for technical reasons in order for our Platform to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies enable us to track and target the interests of our users to enhance the experience on our Platform.
        </p>
      </section>

      <section id="types" className="mb-16">
        <h2>3. Types of Cookies We Use</h2>
        <div className="space-y-8">
          <div className="bg-slate-50 p-6 rounded-xl">
            <h4 className="font-bold mb-2">Essential Cookies</h4>
            <p className="text-sm">These cookies are strictly necessary to provide you with services available through our Platform and to use some of its features, such as access to secure areas.</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-xl">
            <h4 className="font-bold mb-2">Analytics and Customization Cookies</h4>
            <p className="text-sm">These cookies collect information that is used either in aggregate form to help us understand how our Platform is being used or how effective our marketing campaigns are, or to help us customize our Platform for you.</p>
          </div>
        </div>
      </section>

      <section id="choices" className="mb-16">
        <h2>4. Your Choices</h2>
        <p>
          You have the right to decide whether to accept or reject cookies. You can set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted.
        </p>
        <p>
          To learn more about how to manage cookies in your browser, please visit your browser's help menu.
        </p>
      </section>
    </LegalLayout>
  );
}
