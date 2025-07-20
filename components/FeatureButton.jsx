import React from 'react';
import Link from 'next/link';

/**
 * FeatureButton
 * Displays a large, styled button linking to a feature page.
 * Props:
 * - href: target URL
 * - children: button text
 */
export default function FeatureButton({ href, children }) {
  return (
    <Link href={href}>
      <a className="block w-64 py-4 my-2 bg-white text-black text-center rounded shadow hover:opacity-90">
        {children}
      </a>
    </Link>
  );
}