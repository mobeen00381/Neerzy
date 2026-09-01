import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Neerzy",
  description: "Get in touch with the Neerzy team. We're here to help local traders grow their business online via WhatsApp.",
  alternates: {
    canonical: 'https://www.neerzy.com/contact',
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "name": "Contact Us | Neerzy",
  "description": "Get in touch with the Neerzy team.",
  "url": "https://www.neerzy.com/contact"
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-6 py-20 max-w-4xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="text-4xl font-bold mb-8 text-[#0F5132]">Contact Us</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
          <p className="text-[#5B6B64] mb-8">Have questions about Neerzy? Our team is here to help local traders grow.</p>
          
          <div className="mb-6">
            <h3 className="font-bold text-[#0A2E22]">Email</h3>
            <p className="text-[#5B6B64]">support@neerzy.com</p>
          </div>
          
          <div className="mb-6">
            <h3 className="font-bold text-[#0A2E22]">Phone</h3>
            <p className="text-[#5B6B64]">
              <a href="tel:+18338872999" className="hover:text-[#0F5132] transition-colors">Toll Free: +1 (833) 887-2999</a>
            </p>
          </div>
          
          <div className="mb-6">
            <h3 className="font-bold text-[#0A2E22]">Business Address</h3>
            <p className="text-[#5B6B64]">
              Neerzy AI Ltd<br />
              123 Trader Lane, Suite 400<br />
              London, EC1V 2NX<br />
              United Kingdom
            </p>
          </div>
        </div>
        
        <div className="bg-[#F7F9F8] p-8 rounded-2xl border border-[#E1E8E4]">
          <h2 className="text-xl font-bold mb-6">Send a Message</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input type="text" className="w-full p-3 rounded-lg border border-[#E1E8E4]" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" className="w-full p-3 rounded-lg border border-[#E1E8E4]" placeholder="Your email" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea className="w-full p-3 rounded-lg border border-[#E1E8E4] h-32" placeholder="How can we help?"></textarea>
            </div>
            <button className="w-full bg-[#22C55E] text-white font-bold py-3 rounded-lg hover:bg-[#16A34A] transition-all">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
