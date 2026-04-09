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

  useEffect(() => {
    axios.get('/api/subscriptions/plans').then(res => setPlans(res.data));
  }, []);

  return (
    <div>
      <h2>Subscription Plans</h2>
      <ul>
        {plans.map(p => (
          <li key={p.id}>
            {p.name} ({p.role}) – ${p.price_monthly_cents / 100} /mo
            {p.discount_percent > 0 && (` – ${p.discount_percent}% yearly discount`)}
          </li>
        ))}
      </ul>
    </div>
  );
};
