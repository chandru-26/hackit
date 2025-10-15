import React, { useEffect, useState } from 'react';
import HeroSection from './HeroSection';
import PainSection from './PainSection';
import SolutionSection from './SolutionSection';
import CTASection from './CTASection';
import API_BASE from '../config'; // ✅ import backend URL

export default function LandingPage() {
  const [backendStatus, setBackendStatus] = useState(null);

  // Enable smooth scrolling for the entire page
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  // Example: ping backend on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_BASE}/`); // ✅ call your backend using API_BASE
        if (res.ok) {
          setBackendStatus('Backend is live ✅');
        } else {
          setBackendStatus('Backend responded with error ❌');
        }
      } catch (err) {
        console.error('Error connecting to backend:', err);
        setBackendStatus('Backend unreachable ❌');
      }
    };

    checkBackend();
  }, []);

  return (
    <div
      className="min-h-screen text-[var(--text-primary)]"
      style={{ background: 'var(--bg-primary)' }}
    >
      <main>
        <HeroSection />
        <PainSection />
        <SolutionSection />
        <CTASection />
      </main>

      {/* Optional: display backend status for testing */}
      <footer className="text-center p-4 text-sm text-gray-400">
        {backendStatus}
      </footer>
    </div>
  );
}
