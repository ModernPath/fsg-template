'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Footer() {
  const t = useTranslations('Footer');
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en';
  const router = useRouter();

  const handleSignIn = (e: React.MouseEvent) => {
    e.preventDefault();
    const currentLocale = pathname?.split('/')[1] || 'en';
    router.push(`/${currentLocale}/auth/sign-in`);
  };

  return (
    <footer className="bg-gradient-to-b from-gray-900 via-gray-900 to-black border-t border-gray-800">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              BizExit
            </h3>
            <p className="text-gray-400 text-sm">
              AI-powered M&A marketplace. Connecting buyers and sellers for successful business transactions.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/${locale}/sell`} className="text-gray-400 hover:text-blue-400 transition-colors">
                  Sell Your Business
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/buy`} className="text-gray-400 hover:text-blue-400 transition-colors">
                  Buy a Business
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/valuation`} className="text-gray-400 hover:text-blue-400 transition-colors">
                  Business Valuation
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/materials`} className="text-gray-400 hover:text-blue-400 transition-colors">
                  Marketing Materials
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/${locale}/about`} className="text-gray-400 hover:text-blue-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/how-it-works`} className="text-gray-400 hover:text-blue-400 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="text-gray-400 hover:text-blue-400 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/blog`} className="text-gray-400 hover:text-blue-400 transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/${locale}/privacy`} className="text-gray-400 hover:text-blue-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms`} className="text-gray-400 hover:text-blue-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/auth/sign-in`} className="text-gray-400 hover:text-blue-400 transition-colors" onClick={handleSignIn}>
                  Partner Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} BizExit. All rights reserved. Powered by AI.
          </p>
          <div className="flex items-center space-x-6 text-sm">
            <span className="text-gray-500">Made with ❤️ in Finland</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
