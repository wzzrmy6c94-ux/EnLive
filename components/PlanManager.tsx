import React, { useEffect, useState } from 'react';
import axios from 'axios';

type Plan = {
  id: number;
  name: string;
  role: string;
  price_monthly_cents: number;
  discount_percent: number;
};

export const PlanManager: React.FC = () => {
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
    <div>
      {error ? <p className="text-sm text-[var(--text-muted)]">{error}</p> : null}
      {!error && !plans.length ? (
        <p className="text-sm text-[var(--text-muted)]">No subscription plans configured.</p>
      ) : null}
      {plans.length ? (
        <ul className="space-y-2">
          {plans.map(p => (
            <li key={p.id} className="text-sm text-[var(--text-muted)]">
              <span className="font-medium text-[var(--foreground)]">{p.name}</span>
              {' '}({p.role}) - ${(p.price_monthly_cents / 100).toFixed(2)} /mo
              {p.discount_percent > 0 && (` - ${p.discount_percent}% yearly discount`)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
