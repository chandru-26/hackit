import React from 'react';
import { Link } from 'wouter';

export default function Navbar() {
  return (
    <nav style={{ background: 'transparent' }} className="w-full py-4 px-6 flex items-center justify-between">
      <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)' }}>
        <Link href="/">Lana AI</Link>
      </div>
      <div>
        <Link href="/start" className="px-4 py-2 rounded-md" style={{ color: 'var(--text-primary)' }}>Demo</Link>
      </div>
    </nav>
  );
}
