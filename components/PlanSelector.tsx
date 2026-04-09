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

  useEffect(() => {
    axios.get('/api/subscriptions/plans').then(res => setPlans(res.data));
  }, []);

  return (
    <div>
      {plans.map(p => (
        <div key={p.id} style={{ marginBottom: '1rem' }}>
          <h3>{p.name} ({p.role})</h3>
          <p>\${(p.price_monthly_cents / 100).toFixed(2)} / month</p>
          {p.discount_percent > 0 && (
            <p>Yearly: ${(p.price_monthly_cents * 12 * (1 - p.discount_percent / 100) / 100).toFixed(2)} (save {p.discount_percent}%)</p>
          )}
          <button onClick={() => onSelect(p.id, 'monthly')}>Subscribe Monthly</button>
          {p.discount_percent > 0 && <button onClick={() => onSelect(p.id, 'yearly')}>Subscribe Yearly</button>}
        </div>
      ))}
    </div>
  );
};
