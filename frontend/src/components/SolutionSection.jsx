import React from 'react';
import Card, { CardContent } from './Card';

export default function SolutionSection() {
  const features = [
    {
      icon: '🧠',
      title: 'AI-Powered Feedback',
      description: 'Get instant, personalized feedback on your answers.',
      iconColor: 'text-teal-500'
    },
    {
      icon: '💬',
      title: 'Voice Interaction',
      description: 'Practice with natural voice conversations.',
      iconColor: 'text-blue-500'
    },
    {
      icon: '💻',
      title: 'Custom Questions',
      description: 'Tailored questions based on your job role.',
      iconColor: 'text-purple-500'
    },
    {
      icon: '🔄',
      title: 'Progress Tracking',
      description: 'Track your improvement over time.',
      iconColor: 'text-green-500'
    }
  ];

  return (
  <section id="solution" className="py-16 lg:py-24" style={{ background: 'var(--bg-secondary)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Our Solution
          </h2>
          <div style={{ height: 6, width: 120, margin: '0.5rem auto 0', borderRadius: 4, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }} />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg hover:scale-105 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="p-3 rounded-full" style={{ background: 'linear-gradient(90deg, rgba(44,154,255,0.12), rgba(0,224,255,0.06))' }}>
                    <span style={{ fontSize: 22 }}>{feature.icon}</span>
                  </div>
                </div>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  {feature.title}
                </h3>
                    <p className="text-sm leading-relaxed muted-text">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
