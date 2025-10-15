import React, { useState } from 'react';
import { useLocation } from 'wouter';

export default function StartDemo() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);

  const prewarmAndGo = async () => {
    // Navigate immediately. We'll initialize Anam when the user clicks the avatar to start.
    setLocation('/agent');
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Start Demo</h1>
      <p className="mb-4">Click Start to open the Anam AI avatar with voice. No resume upload — just the avatar and chat.</p>
      <div className="flex gap-2">
        <button onClick={prewarmAndGo} disabled={loading} className="px-6 py-3 bg-indigo-600 text-white rounded font-semibold">
          {loading ? 'Starting...' : 'Start Demo'}
        </button>
      </div>
    </div>
  );
}
