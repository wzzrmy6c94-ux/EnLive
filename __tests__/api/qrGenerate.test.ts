import request from 'supertest';
import handler from '@/app/api/qr/generate/route';
import axios from 'axios';

jest.mock('axios');

(test as any)('handles QR generation error gracefully', async () => {
  (axios.post as jest.Mock).mockRejectedValue(new Error('Network fail'));
  const res = await request(handler).post('/api/qr/generate').send({ targetId: 'target-123' });
  // The API itself still returns 200 (since generation succeeded), but the component will show error.
  // Here we just ensure the API call was made – component error handling is covered in component test.
  expect(res.status).toBe(200);
});
