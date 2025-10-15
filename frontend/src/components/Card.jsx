import React from 'react';

export default function Card({ children, className }) {
  return (
    <div className={`rounded-lg border shadow-sm ${className || ''}`} style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', borderColor: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)' }}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }) {
  return (
    <div className={`p-6 ${className || ''}`}>
      {children}
    </div>
  );
}
