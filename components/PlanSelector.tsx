import React, { useEffect, useState } from 'react';
import axios from 'axios';

type Plan = {
  id: number;
  name: string;
  role: string;
  price_monthly_cents: number;
  discount_percent: number;
};

export const PlanSelector: React.FC<{ onSelect: (planId: number, interval: 'monthly' | 'yearly') => void }> = ({ onSelect }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios.get('/api/subscriptions/plans')
      .then(res => {
        setPlans(res.data);
        setError(null);
      })
      .catch(() => {
        setPlans([]);
        setError('Subscription plans are not available yet.');
      });
  }, []);

  return (
    <div className="mt-8">
      {error ? <div className="border-l-2 border-[var(--danger)] py-3 pl-4 text-sm text-[var(--danger)]">{error}</div> : null}
      <div className="grid gap-px overflow-hidden border border-[var(--border)] bg-[var(--border)] md:grid-cols-2">
      {plans.map((p) => (
        <article key={p.id} className="flex min-h-80 flex-col bg-[var(--surface)] p-6 sm:p-8">
          <p className="enlive-eyebrow">{p.role}</p>
          <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-[var(--text-strong)]">{p.name}</h2>
          <div className="mt-7 flex items-end gap-2"><span className="text-4xl font-black tracking-[-0.06em] text-[var(--foreground)]">${(p.price_monthly_cents / 100).toFixed(2)}</span><span className="pb-1 text-sm text-[var(--text-muted)]">/ month</span></div>
          {p.discount_percent > 0 ? <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">Yearly: ${(p.price_monthly_cents * 12 * (1 - p.discount_percent / 100) / 100).toFixed(2)} — save {p.discount_percent}%</p> : <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">Monthly subscription</p>}
          <div className="mt-auto space-y-3 pt-8">
            <button type="button" onClick={() => onSelect(p.id, 'monthly')} className="min-h-11 w-full rounded-md bg-[var(--primary)] px-4 text-sm font-bold text-[var(--button-text)] transition hover:opacity-90">Subscribe monthly</button>
            {p.discount_percent > 0 && <button type="button" onClick={() => onSelect(p.id, 'yearly')} className="min-h-10 w-full text-xs font-bold uppercase tracking-[0.1em] text-[var(--primary)]">Subscribe yearly</button>}
          </div>
        </article>
      ))}
      </div>
    </div>
  );
};
