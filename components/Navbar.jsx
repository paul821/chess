import React, { useContext } from 'react';
import Link from 'next/link';
import { AuthContext } from '../pages/_app';

/**
 * Navbar
 * Simple navigation bar with Home link and optional Sign In/Sign Out.
 */
export default function Navbar() {
  const { user } = useContext(AuthContext);

  return (
    <nav className="flex justify-between items-center p-4 bg-black">
      <div>
        <Link href="/">
          <a className="text-white text-lg font-semibold hover:text-gray-300">Home</a>
        </Link>
      </div>
      <div>
        {user ? (
          <button
            onClick={() => auth.signOut()}
            className="text-white hover:text-gray-300"
          >
            Sign Out
          </button>
        ) : (
          <Link href="/login">
            <a className="text-white hover:text-gray-300">Sign In</a>
          </Link>
        )}
      </div>
    </nav>
  );
}
