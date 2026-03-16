import { Pool } from "pg";

let pool: Pool | null = null;

function getPool() {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }
  pool = new Pool({
    connectionString,
    ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
  });
  return pool;
}

export async function takePgRateLimit(key: string, limit: number, windowMs: number) {
  const p = getPool();
  const windowSeconds = Math.ceil(windowMs / 1000);

  const res = await p.query<{
    count: number;
    reset_at: string;
  }>(
    `INSERT INTO api_rate_limits (key, count, reset_at, updated_at)
     VALUES ($1, 1, now() + ($2 || ' seconds')::interval, now())
     ON CONFLICT (key)
     DO UPDATE SET
       count = CASE
         WHEN api_rate_limits.reset_at <= now() THEN 1
         ELSE api_rate_limits.count + 1
       END,
       reset_at = CASE
         WHEN api_rate_limits.reset_at <= now() THEN now() + ($2 || ' seconds')::interval
         ELSE api_rate_limits.reset_at
       END,
       updated_at = now()
     RETURNING count, reset_at`,
    [key, String(windowSeconds)],
  );

  const row = res.rows[0];
  const resetAt = new Date(row.reset_at).getTime();
  const count = Number(row.count);
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt,
    count,
  };
}
