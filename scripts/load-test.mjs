import process from 'node:process';
import autocannon from 'autocannon';

const baseUrl = process.env.LOAD_TEST_URL || 'http://localhost:3000';
const includeWrites = process.argv.includes('--include-writes');

const requests = [
  { method: 'GET', path: '/api/leaderboard?type=venue&location=All&minRatings=1' },
  { method: 'GET', path: '/api/leaderboard?type=artist&location=All&minRatings=1' },
  { method: 'GET', path: '/api/targets/venue-crown-social' },
  { method: 'GET', path: '/api/targets/artist-neon-harbor' },
];

if (includeWrites) {
  requests.push({
    method: 'POST',
    path: '/api/ratings',
    headers: {
      'content-type': 'application/json',
      'x-device-id': `loadtest-${Date.now()}`,
    },
    body: JSON.stringify({
      targetId: 'venue-crown-social',
      category1: 4,
      category2: 4,
      category3: 4,
      category4: 4,
    }),
  });
}

console.log(`Running load test against ${baseUrl}`);
console.log(`Requests: ${requests.map((r) => `${r.method} ${r.path}`).join(', ')}`);

const instance = autocannon({
  url: baseUrl,
  connections: Number(process.env.LOAD_TEST_CONNECTIONS || 10),
  duration: Number(process.env.LOAD_TEST_DURATION || 15),
  pipelining: 1,
  requests,
});

autocannon.track(instance, { renderProgressBar: true });

instance.on('done', (result) => {
  console.log('\nSummary');
  console.log(JSON.stringify({
    requestsAverage: result.requests.average,
    requestsTotal: result.requests.total,
    latencyAverageMs: result.latency.average,
    latencyP99Ms: result.latency.p99,
    errors: result.errors,
    timeouts: result.timeouts,
    non2xx: result.non2xx,
  }, null, 2));
});
