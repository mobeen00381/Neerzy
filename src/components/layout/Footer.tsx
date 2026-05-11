import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Neerzy</h3>
            <p className="text-sm text-slate-500">
              Done-for-you SEO websites and Google Business management for local service businesses.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/" className="hover:text-blue-500 transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-blue-500 transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="#" className="hover:text-blue-500 transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-blue-500 transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="#" className="hover:text-blue-500 transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-blue-500 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Neerzy. All rights reserved.
          </p>
          <div className="text-sm text-slate-500 mt-4 sm:mt-0">
            Built for Local Businesses
          </div>
        </div>
      </div>
    </footer>
  );
}
