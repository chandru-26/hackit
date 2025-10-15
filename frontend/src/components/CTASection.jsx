import React from 'react';
import { useLocation } from 'wouter';
import Button from './Button';

export default function CTASection() {
  const [, setLocation] = useLocation();

  const handleStartDemo = () => {
    setLocation('/start');
  };

  return (
    <section id="cta" className="py-16 lg:py-24" style={{ background: 'var(--bg-secondary)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight" style={{ color: 'var(--text-primary)' }}>
          Stop feeling unprepared.{' '}
          <span style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent-2))', WebkitBackgroundClip: 'text', color: 'transparent' }}>
            Start practicing with your AI coach.
          </span>
        </h2>

        <Button
          size="lg"
          onClick={handleStartDemo}
          className="accent-btn font-semibold px-12 py-6 h-auto text-xl"
        >
          Start Demo
        </Button>

        <p className="mt-4 muted-text">
          Practice anytime, get feedback instantly.
        </p>
      </div>
    </section>
  );
}
