import React from 'react';
import Card, { CardContent } from './Card';

export default function PainSection() {
  const painPoints = [
    {
      icon: '⚠️',
      title: 'Interview Anxiety',
      description: 'Feeling nervous and unprepared for job interviews.',
      iconColor: 'text-red-500'
    },
    {
      icon: '🕒',
      title: 'No Feedback',
      description: 'Practicing alone without knowing how to improve.',
      iconColor: 'text-yellow-500'
    },
    {
      icon: '📈',
      title: 'Lack of Experience',
      description: 'Not enough mock interviews to build confidence.',
      iconColor: 'text-blue-500'
    }
  ];

  return (
  <section id="pain" className="py-16 lg:py-24" style={{ background: 'var(--bg-secondary)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            The Pain Today
          </h2>
          <div style={{ height: 6, width: 120, margin: '0.5rem auto 0', borderRadius: 4, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }} />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {painPoints.map((point, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="p-3 rounded-full" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {point.icon}
                  </div>
                </div>
                    <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  {point.title}
                </h3>
                    <p className="leading-relaxed muted-text">
                  {point.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
