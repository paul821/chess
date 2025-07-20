//components/Navbar.jsx
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../pages/_app';
import { signOutUser } from '../lib/firebase';

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOutUser();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Practice', href: '/practice' },
    { name: 'Explorer', href: '/explorer' },
    { name: 'Review', href: '/review' },
    { name: 'Blunders', href: '/blunder' },
    { name: 'Endgames', href: '/endgame' },
    { name: 'Style', href: '/style', requireAuth: true }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-black hover:text-gray-700">
              Chess Trainer
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              // Hide auth-required items for non-authenticated users
              if (item.requireAuth && !user) return null;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    router.pathname === item.href
                      ? 'text-black'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Welcome back!
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-sm font-medium text-gray-600 hover:text-black"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-black hover:text-gray-700"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-600 hover:text-black p-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="py-4 space-y-2">
              {navigation.map((item) => {
                if (item.requireAuth && !user) return null;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block px-3 py-2 text-sm font-medium transition-colors ${
                      router.pathname === item.href
                        ? 'text-black bg-gray-50'
                        : 'text-gray-600 hover:text-black hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                );
              })}
              
              <div className="px-3 py-2 border-t border-gray-200 mt-4">
                {user ? (
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="text-sm font-medium text-gray-600 hover:text-black"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="text-sm font-medium text-black hover:text-gray-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}