'use client';
import React from 'react';
import { PlanSelector } from '@/components/PlanSelector';
import { useRouter } from 'next/navigation';
import { EnliveShell } from '@/components/enlive-shell';

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

  return <EnliveShell title="Subscription Plans" headerMode="public" hideHeroHeader>
    <main className="mx-auto w-full max-w-5xl py-7 sm:py-10">
      <section className="border-b border-[var(--border)] pb-7">
        <p className="enlive-eyebrow">EnLive for artists & venues</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] text-[var(--text-strong)] sm:text-6xl">Choose your plan</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">Select the EnLive subscription that fits your live music presence.</p>
      </section>
      <PlanSelector onSelect={handleSelect} />
    </main>
  </EnliveShell>;
}
