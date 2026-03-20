import { Pool, type PoolClient } from "pg";
import { hashPassword, verifyPassword } from "@/lib/server/auth";

export type Role = "venue" | "artist" | "city" | "admin";
export type TargetType = "venue" | "artist" | "city";

type UserRow = {
  id: string;
  enlive_uid?: string;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  location: string;
  genre?: string;
  country?: string;
  settings_json?: string | null;
  created_at: string;
};

type RatingRow = {
  id: string;
  target_id: string;
  target_type: TargetType;
  category_1_score: number;
  category_2_score: number;
  category_3_score: number;
  category_4_score: number | null;
  overall_score: number;
  location: string;
  device_id: string;
  created_at: string;
};

const CATEGORY_SCORE_MAX = 5;

function toHundredPointScore(value: number) {
  return Math.round(((value / CATEGORY_SCORE_MAX) * 100) * 100) / 100;
}

let poolSingleton: Pool | null = null;
let initPromise: Promise<void> | null = null;

function mean(values: number[]) {
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, n) => sum + n, 0) / values.length) * 100) / 100;
}

function defaultUserSettings(role: TargetType) {
  return role === "artist"
    ? { genre: "Unknown", showcaseEnabled: true, socialLinks: false }
    : { capacity: null, bookingOpen: true, wheelchairAccess: false };
}

function isValidEnliveUid(role: TargetType, enliveUid: string) {
  const normalized = enliveUid.trim().toUpperCase();
  return new RegExp(`^${role === "artist" ? "A" : "V"}\\d{6}$`).test(normalized);
}

function nextEnliveUid(role: TargetType, existing: string[]) {
  const prefix = role === "artist" ? "A" : "V";
  const nextNumber = existing
    .map((uid) => Number(uid.slice(1)))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 0) + 1;
  return `${prefix}${String(nextNumber).padStart(6, "0")}`;
}

function getPool() {
  if (poolSingleton) return poolSingleton;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Configure Postgres before using server data APIs.");
  }

  poolSingleton = new Pool({
    connectionString,
    ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
  });
  return poolSingleton;
}

function seedUsers(): UserRow[] {
  return [
    { id: "admin-enlive", enlive_uid: "admin-enlive", name: "Enlive Admin", email: "admin@enlive.local", password_hash: hashPassword("secret123"), role: "admin", location: "Chorley", genre: "Admin", settings_json: JSON.stringify({}), created_at: "2026-02-20T18:00:00.000Z" },
  ];
}

function seedRatings(): RatingRow[] {
  return [];
}

async function ensureInitialized() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const pool = getPool();
    const client = await pool.connect();
    try {
      const schemaCheck = await client.query<{ table_name: string }>(
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name IN ('users', 'ratings')`,
      );
      const foundTables = new Set(schemaCheck.rows.map((r) => r.table_name));
      if (!foundTables.has("users") || !foundTables.has("ratings")) {
        throw new Error(
          "Database schema is missing. Run `npm run db:migrate` (and `npm run db:seed` if needed) before starting the app.",
        );
      }

      // Seed only when the schema exists and the database is empty.
      await client.query("BEGIN");
      const countRes = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM users`);
      if (Number(countRes.rows[0]?.count ?? 0) === 0) {
        for (const u of seedUsers()) {
          await client.query(
            `INSERT INTO users (id, enlive_uid, name, email, password_hash, role, location, genre, country, settings_json, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [
              u.id,
              u.enlive_uid ?? u.id,
              u.name,
              u.email,
              u.password_hash,
              u.role,
              u.location,
              u.genre ?? null,
              u.country ?? null,
              u.settings_json ?? JSON.stringify(u.role === "admin" ? {} : defaultUserSettings(u.role)),
              u.created_at,
            ],
          );
        }
        for (const r of seedRatings()) {
          await client.query(
            `INSERT INTO ratings (
              id,target_id,target_type,category_1_score,category_2_score,category_3_score,
              category_4_score,overall_score,location,device_id,created_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [
              r.id,
              r.target_id,
              r.target_type,
              r.category_1_score,
              r.category_2_score,
              r.category_3_score,
              r.category_4_score,
              r.overall_score,
              r.location,
              r.device_id,
              r.created_at,
            ],
          );
        }
      }
      await client.query("COMMIT");
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Ignore rollback failure if no transaction is active.
      }
      throw error;
    } finally {
      client.release();
    }
  })();

  return initPromise;
}

async function withDb<T>(fn: (client: PoolClient) => Promise<T>) {
  await ensureInitialized();
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function listLocations() {
  return withDb(async (db) => {
    const res = await db.query<{ location: string }>(
      `SELECT DISTINCT location FROM users WHERE role != 'admin' ORDER BY location ASC`,
    );
    return res.rows.map((r) => r.location);
  });
}

export async function getLeaderboard(params: { targetType: TargetType; location?: string; minRatings?: number }) {
  return withDb(async (db) => {
    const minRatings = Math.max(0, params.minRatings ?? 1);
    const res = await db.query<{
      id: string;
      name: string;
      location: string;
      genre: string | null;
      country: string | null;
      role: TargetType;
      average_score: number | null;
      rating_count: string;
    }>(
      `SELECT
         u.id, u.name, u.location, u.genre, u.country, u.role,
         ROUND(AVG(r.overall_score)::numeric, 2)::float8 AS average_score,
         COUNT(r.id)::text AS rating_count
       FROM users u
       LEFT JOIN ratings r ON r.target_id = u.id AND r.target_type = u.role
       WHERE u.role = $1 AND (($2::text IS NULL OR $1::text = 'city') OR u.location = $2)
       GROUP BY u.id
       HAVING COUNT(r.id) >= $3
       ORDER BY average_score DESC NULLS LAST, COUNT(r.id) DESC, u.name ASC`,
      [params.targetType, params.location ?? null, minRatings],
    );

    return res.rows.map((row) => ({
      id: row.id,
      name: row.name,
      location: row.location,
      genre: row.genre,
      country: row.country,
      role: row.role,
      averageScore: row.average_score ?? 0,
      ratingCount: Number(row.rating_count),
    }));
  });
}

export async function getTargetById(id: string) {
  return withDb(async (db) => {
    const targetRes = await db.query<{
      id: string;
      enlive_uid: string | null;
      name: string;
      role: TargetType;
      location: string;
      genre: string | null;
      settings_json: string | null;
      created_at: string;
    }>(`SELECT id, enlive_uid, name, role, location, genre, settings_json, created_at FROM users WHERE id = $1 AND role IN ('venue','artist','city')`, [id]);
    const target = targetRes.rows[0];
    if (!target) return null;

    const settings = JSON.parse(target.settings_json ?? "{}") as Record<string, unknown>;
    const bio = typeof settings.bio === "string" ? settings.bio : null;

    const ratingsRes = await db.query<RatingRow>(`SELECT * FROM ratings WHERE target_id = $1 ORDER BY created_at DESC LIMIT 25`, [id]);
    const ratings = ratingsRes.rows;
    const c4 = ratings.map((r) => r.category_4_score).filter((v): v is number => typeof v === "number");

    return {
      id: target.id,
      enliveUid: target.enlive_uid,
      name: target.name,
      role: target.role,
      location: target.location,
      genre: target.genre,
      bio,
      createdAt: new Date(target.created_at).toISOString(),
      stats: {
        totalRatings: ratings.length,
        averageScore: mean(ratings.map((r) => Number(r.overall_score))),
        category1Average: mean(ratings.map((r) => Number(r.category_1_score))),
        category2Average: mean(ratings.map((r) => Number(r.category_2_score))),
        category3Average: mean(ratings.map((r) => Number(r.category_3_score))),
        category4Average: c4.length ? mean(c4.map(Number)) : null,
      },
      recentRatings: ratings.map((r) => ({
        id: r.id,
        overallScore: Number(r.overall_score),
        category1: Number(r.category_1_score),
        category2: Number(r.category_2_score),
        category3: Number(r.category_3_score),
        category4: r.category_4_score == null ? null : Number(r.category_4_score),
        createdAt: new Date(r.created_at).toISOString(),
      })),
    };
  });
}

export async function insertRating(input: {
  targetId: string;
  category1: number;
  category2: number;
  category3: number;
  category4?: number;
  deviceId: string;
}) {
  return withDb(async (db) => {
    const targetRes = await db.query<{ id: string; role: TargetType; location: string }>(
      `SELECT id, role, location FROM users WHERE id = $1 AND role IN ('venue','artist','city')`,
      [input.targetId],
    );
    const target = targetRes.rows[0];
    if (!target) return { ok: false as const, error: "Target not found." };

    const values = [input.category1, input.category2, input.category3];
    if (typeof input.category4 === "number") values.push(input.category4);
    if (!values.every((v) => Number.isFinite(v) && v >= 1 && v <= 5)) {
      return { ok: false as const, error: "Scores must be between 1 and 5." };
    }

    const dupRes = await db.query<{ created_at: string }>(
      `SELECT created_at FROM ratings WHERE target_id = $1 AND device_id = $2 ORDER BY created_at DESC LIMIT 1`,
      [input.targetId, input.deviceId],
    );
    const duplicate = dupRes.rows[0];
    if (duplicate && Date.now() - Date.parse(duplicate.created_at) < 60_000) {
      return { ok: false as const, error: "Please wait a minute before rating this act/venue again." };
    }

    const overall = toHundredPointScore(mean(values));
    const id = `rating-${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();
    await db.query(
      `INSERT INTO ratings (
        id,target_id,target_type,category_1_score,category_2_score,category_3_score,
        category_4_score,overall_score,location,device_id,created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        id,
        target.id,
        target.role,
        input.category1,
        input.category2,
        input.category3,
        input.category4 ?? null,
        overall,
        target.location,
        input.deviceId,
        createdAt,
      ],
    );

    return {
      ok: true as const,
      rating: { id, targetId: target.id, targetType: target.role, overallScore: overall, location: target.location, createdAt },
    };
  });
}

export async function authenticateUser(email: string, password: string) {
  return withDb(async (db) => {
    const res = await db.query<UserRow>(
      `SELECT id, enlive_uid, name, email, password_hash, role, location, created_at FROM users WHERE lower(email) = lower($1) LIMIT 1`,
      [email.trim()],
    );
    const user = res.rows[0];
    if (!user) return null;
    if (!verifyPassword(password, user.password_hash)) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      location: user.location,
      createdAt: new Date(user.created_at).toISOString(),
    };
  });
}

export async function getUserById(id: string) {
  return withDb(async (db) => {
    const res = await db.query<Omit<UserRow, "password_hash">>(
      `SELECT id, enlive_uid, name, email, role, location, created_at FROM users WHERE id = $1 LIMIT 1`,
      [id],
    );
    const user = res.rows[0];
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      location: user.location,
      createdAt: new Date(user.created_at).toISOString(),
    };
  });
}

export async function listUsersForAdmin() {
  return withDb(async (db) => {
    const res = await db.query<{
      id: string;
      enlive_uid: string;
      name: string;
      role: TargetType;
      location: string;
      created_at: string;
      average_score: number | null;
      rating_count: string;
    }>(
      `SELECT
         u.id,u.enlive_uid,u.name,u.role,u.location,u.created_at,
         ROUND(AVG(r.overall_score)::numeric,2)::float8 AS average_score,
         COUNT(r.id)::text AS rating_count
       FROM users u
       LEFT JOIN ratings r ON r.target_id = u.id
       WHERE u.role IN ('venue','artist','city')
       GROUP BY u.id
       ORDER BY u.created_at DESC`,
    );

    return res.rows.map((u) => ({
      id: u.id,
      enliveUid: u.enlive_uid,
      name: u.name,
      role: u.role,
      location: u.location,
      createdAt: new Date(u.created_at).toISOString(),
      averageScore: u.average_score ?? 0,
      ratingCount: Number(u.rating_count),
    }));
  });
}

export async function listRecentRatingsForAdmin(limit = 20) {
  return withDb(async (db) => {
    const res = await db.query<{
      id: string;
      target_id: string;
      target_type: TargetType;
      overall_score: number;
      location: string;
      created_at: string;
      target_name: string | null;
    }>(
      `SELECT r.id, r.target_id, r.target_type, r.overall_score, r.location, r.created_at, u.name AS target_name
       FROM ratings r
       LEFT JOIN users u ON u.id = r.target_id
       ORDER BY r.created_at DESC
       LIMIT $1`,
      [limit],
    );

    return res.rows.map((r) => ({
      id: r.id,
      targetId: r.target_id,
      targetType: r.target_type,
      overallScore: Number(r.overall_score),
      location: r.location,
      createdAt: new Date(r.created_at).toISOString(),
      targetName: r.target_name,
    }));
  });
}

export async function createManagedUser(input: {
  name: string;
  email: string;
  role: TargetType;
  location?: string;
  enliveUid?: string;
  password?: string;
  genre?: string;
  settings?: Record<string, unknown>;
}) {
  return withDb(async (db) => {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const location = input.location?.trim() ?? "";
    const requestedUid = input.enliveUid?.trim().toUpperCase();
    if (!name || !email) return { ok: false as const, error: "Name and email are required." };
    if (input.role !== "artist" && !location) return { ok: false as const, error: "Town is required for venues." };
    let enliveUid = requestedUid;
    if (!enliveUid) {
      const existing = await db.query<{ enlive_uid: string }>(
        `SELECT enlive_uid FROM users WHERE enlive_uid LIKE $1 ORDER BY enlive_uid DESC`,
        [input.role === "artist" ? "A%" : "V%"],
      );
      enliveUid = nextEnliveUid(input.role, existing.rows.map((row) => row.enlive_uid));
    }
    if (!isValidEnliveUid(input.role, enliveUid)) {
      return {
        ok: false as const,
        error: input.role === "artist" ? "Artist IDs must look like A123456." : "Venue IDs must look like V123456.",
      };
    }

    const exists = await db.query<{ id: string }>(`SELECT id FROM users WHERE lower(email) = lower($1)`, [email]);
    if (exists.rows[0]) return { ok: false as const, error: "Email already exists." };
    const uidExists = await db.query<{ id: string }>(`SELECT id FROM users WHERE lower(enlive_uid) = lower($1)`, [enliveUid]);
    if (uidExists.rows[0]) return { ok: false as const, error: "EnLive Unique ID already exists." };

    const id = `${input.role}-${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();
    const password = input.password?.trim() || "demo123";
    const passwordHash = hashPassword(password);
    const genre = input.genre?.trim() || (input.role === 'artist' ? 'Unknown' : 'Live Music Venue');
    const settings = input.settings ?? defaultUserSettings(input.role);

    await db.query(
      `INSERT INTO users (id,enlive_uid,name,email,password_hash,role,location,genre,settings_json,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, enliveUid, name, email, passwordHash, input.role, location, genre, JSON.stringify(settings), createdAt],
    );

    return { ok: true as const, user: { id, enliveUid, name, email, role: input.role, location, createdAt }, password, settings };
  });
}

export async function updateUserProfile(id: string, input: { name: string; location: string; genre?: string; bio?: string }) {
  return withDb(async (db) => {
    const name = input.name.trim();
    const location = input.location.trim();
    if (!name || !location) return { ok: false as const, error: "Name and location are required." };

    const existingRes = await db.query<{ settings_json: string | null }>(
      `SELECT settings_json FROM users WHERE id = $1`,
      [id],
    );
    const existing = JSON.parse(existingRes.rows[0]?.settings_json ?? "{}") as Record<string, unknown>;
    const bio = typeof input.bio === "string" ? input.bio.trim().slice(0, 500) : existing.bio ?? null;
    const updatedSettings = JSON.stringify({ ...existing, bio });

    await db.query(
      `UPDATE users SET name = $1, location = $2, genre = $3, settings_json = $4 WHERE id = $5`,
      [name, location, input.genre?.trim() || null, updatedSettings, id],
    );
    return { ok: true as const };
  });
}

export async function clearAllRatings() {
  return withDb(async (db) => {
    await db.query(`DELETE FROM ratings`);
  });
}

export async function resetDatabaseToSeed() {
  return withDb(async (db) => {
    await db.query("BEGIN");
    try {
      await db.query(`DELETE FROM ratings`);
      await db.query(`DELETE FROM users`);
      for (const u of seedUsers()) {
        await db.query(
          `INSERT INTO users (id,enlive_uid,name,email,password_hash,role,location,genre,country,settings_json,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [
            u.id,
            u.enlive_uid ?? u.id,
            u.name,
            u.email,
            u.password_hash,
            u.role,
            u.location,
            u.genre ?? null,
            u.country ?? null,
            u.settings_json ?? JSON.stringify(u.role === "admin" ? {} : defaultUserSettings(u.role)),
            u.created_at,
          ],
        );
      }
      for (const r of seedRatings()) {
        await db.query(
          `INSERT INTO ratings (
            id,target_id,target_type,category_1_score,category_2_score,category_3_score,
            category_4_score,overall_score,location,device_id,created_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [
            r.id,
            r.target_id,
            r.target_type,
            r.category_1_score,
            r.category_2_score,
            r.category_3_score,
            r.category_4_score,
            r.overall_score,
            r.location,
            r.device_id,
            r.created_at,
          ],
        );
      }
      await db.query("COMMIT");
    } catch (e) {
      await db.query("ROLLBACK");
      throw e;
    }
  });
}
