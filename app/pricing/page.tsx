import React from 'react';
import { PlanSelector } from '@/components/PlanSelector';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const router = useRouter();

  const handleSelect = async (planId: number, interval: 'monthly' | 'yearly') => {
    const res = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, interval }),
    });
    if (res.ok) {
      const data = await res.json();
      // After successful subscription, redirect to profile or show success
      router.push('/users/profile');
    } else {
      // simple error handling
      const error = await res.text();
      alert('Subscription failed: ' + error);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Choose a Subscription Plan</h1>
      <PlanSelector onSelect={handleSelect} />
    </main>
  );
}
