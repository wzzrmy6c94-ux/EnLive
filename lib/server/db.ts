import crypto from "node:crypto";
import { Pool, type PoolClient } from "pg";
import { halfLifeDaysForRole, nextRatingAggregate } from "@/lib/ranking";
import { CEILING_SWEEP_ERROR, isCeilingSweepRating } from "@/lib/rating-quality";
import { hashPassword, verifyPassword } from "@/lib/server/auth";

export type Role = "venue" | "artist" | "city" | "admin";
export type TargetType = "venue" | "artist" | "city";

type UserRow = {
  id: string;
  enlive_uid?: string;
  username: string;
  name: string;
  email: string | null;
  email_verified_at?: string | null;
  email_verification_token_hash?: string | null;
  email_verification_expires_at?: string | null;
  password_hash: string;
  role: Role;
  location: string;
  genre?: string;
  country?: string;
  settings_json?: string | null;
  square_subscription_id?: string | null;
  square_customer_id?: string | null;
  current_score?: number | null;
  denominator?: number | null;
  last_rating_timestamp?: string | null;
  rating_count?: number | null;
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

type PublicSocialLinks = {
  website: string | null;
  instagram: string | null;
  tiktok: string | null;
};

export type ProfileModerationStatus = "active" | "flagged" | "disabled";

type ProfileModeration = {
  status: ProfileModerationStatus;
  reason: string | null;
  updatedAt: string | null;
};

const CATEGORY_SCORE_MIN = 0;
const CATEGORY_SCORE_MAX = 100;
const DUPLICATE_RATING_WINDOW_MS = 24 * 60 * 60 * 1000;

function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}

function isCategoryScore(value: number) {
  return Number.isFinite(value) && value >= CATEGORY_SCORE_MIN && value <= CATEGORY_SCORE_MAX;
}

let poolSingleton: Pool | null = null;
let initPromise: Promise<void> | null = null;

function mean(values: number[]) {
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, n) => sum + n, 0) / values.length) * 100) / 100;
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function isValidUsername(value: string) {
  return /^[a-z0-9][a-z0-9_-]{2,29}$/.test(value);
}

function usernameBase(name: string, email: string, role: TargetType) {
  const source = name || email.split("@")[0] || role;
  const base = source
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^[_-]+|[_-]+$/g, "")
    .slice(0, 24);
  return base.length >= 3 ? base : role;
}

async function nextAvailableUsername(db: PoolClient, base: string) {
  const safeBase = isValidUsername(base) ? base : "enlive_user";
  const res = await db.query<{ username: string }>(
    `SELECT username FROM users WHERE lower(username) = lower($1) OR lower(username) LIKE lower($2)`,
    [safeBase, `${safeBase}-%`],
  );
  const taken = new Set(res.rows.map((row) => row.username.toLowerCase()));
  if (!taken.has(safeBase)) return safeBase;
  for (let suffix = 2; suffix < 10_000; suffix += 1) {
    const candidate = `${safeBase.slice(0, 29 - String(suffix).length)}-${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${safeBase.slice(0, 20)}-${crypto.randomUUID().slice(0, 8)}`;
}

function createEmailVerificationToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashEmailVerificationToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function defaultUserSettings(role: TargetType) {
  return role === "artist"
    ? { genre: "Unknown", showcaseEnabled: true, socialLinks: {}, moderation: { status: "active" } }
    : { capacity: null, bookingOpen: true, wheelchairAccess: false, socialLinks: {}, moderation: { status: "active" } };
}

function readOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readPublicSocialLinks(settings: Record<string, unknown>): PublicSocialLinks {
  const socialLinks = settings.socialLinks;
  const source = socialLinks && typeof socialLinks === "object" && !Array.isArray(socialLinks)
    ? (socialLinks as Record<string, unknown>)
    : {};

  return {
    website: readOptionalString(source.website),
    instagram: readOptionalString(source.instagram),
    tiktok: readOptionalString(source.tiktok),
  };
}

function normalizePublicUrl(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString().slice(0, 240);
  } catch {
    return null;
  }
}

function isProfileModerationStatus(value: unknown): value is ProfileModerationStatus {
  return value === "active" || value === "flagged" || value === "disabled";
}

function readProfileModeration(settings: Record<string, unknown>): ProfileModeration {
  const moderation = settings.moderation;
  const source = moderation && typeof moderation === "object" && !Array.isArray(moderation)
    ? (moderation as Record<string, unknown>)
    : {};
  const legacyDisabled = settings.disabled === true;
  const status = isProfileModerationStatus(source.status)
    ? source.status
    : legacyDisabled
      ? "disabled"
      : "active";

  return {
    status,
    reason: readOptionalString(source.reason),
    updatedAt: readOptionalString(source.updatedAt),
  };
}

function withProfileModeration(
  settings: Record<string, unknown>,
  moderation: ProfileModeration,
) {
  return {
    ...settings,
    moderation: {
      status: moderation.status,
      reason: moderation.reason,
      updatedAt: moderation.updatedAt,
    },
  };
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
    { id: "admin-enlive", enlive_uid: "admin-enlive", username: "admin", name: "Enlive Admin", email: "admin@enlive.local", email_verified_at: "2026-02-20T18:00:00.000Z", password_hash: hashPassword("secret123"), role: "admin", location: "Chorley", genre: "Admin", settings_json: JSON.stringify({}), created_at: "2026-02-20T18:00:00.000Z" },
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
            `INSERT INTO users (id, enlive_uid, username, name, email, email_verified_at, password_hash, role, location, genre, country, settings_json, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
            [
              u.id,
              u.enlive_uid ?? u.id,
              u.username,
              u.name,
              u.email,
              u.email_verified_at ?? null,
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
      // Clear cached promise so the next call can retry
      initPromise = null;
      throw error;
    } finally {
      client.release();
    }
  })();

  return initPromise;
}

export async function withDb<T>(fn: (client: PoolClient) => Promise<T>) {
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
      `SELECT DISTINCT location
       FROM users
       WHERE role != 'admin'
         AND COALESCE(settings_json::jsonb #>> '{moderation,status}', 'active') <> 'disabled'
       ORDER BY location ASC`,
    );
    return res.rows.map((r) => r.location);
  });
}

const DEFAULT_LEADERBOARD_MIN_RATINGS = 5;

async function getCityRank(
  db: PoolClient,
  target: { id: string; role: TargetType; location: string },
  minRatings = DEFAULT_LEADERBOARD_MIN_RATINGS,
) {
  const res = await db.query<{ city_rank: string }>(
    `SELECT ranked.city_rank::text
     FROM (
       SELECT
         u.id,
         ROW_NUMBER() OVER (
           ORDER BY u.current_score DESC NULLS LAST,
                    u.rating_count DESC,
                    u.last_rating_timestamp DESC NULLS LAST,
                    u.name ASC
         ) AS city_rank
       FROM users u
       WHERE u.role = $1
         AND u.location = $2
         AND u.rating_count >= $3
         AND COALESCE(u.settings_json::jsonb #>> '{moderation,status}', 'active') <> 'disabled'
     ) ranked
     WHERE ranked.id = $4`,
    [target.role, target.location, minRatings, target.id],
  );

  const rank = Number(res.rows[0]?.city_rank);
  return Number.isFinite(rank) ? rank : null;
}

export async function getLeaderboard(params: { targetType: TargetType; location?: string; minRatings?: number }) {
  return withDb(async (db) => {
    const minRatings = Math.max(0, params.minRatings ?? DEFAULT_LEADERBOARD_MIN_RATINGS);
    const res = await db.query<{
      id: string;
      name: string;
      location: string;
      genre: string | null;
      country: string | null;
      role: TargetType;
      internal_score: number | null;
      average_score: number | null;
      rating_count: number;
      last_rating_timestamp: string | null;
    }>(
      `SELECT
         u.id, u.name, u.location, u.genre, u.country, u.role,
         u.current_score::float8 AS internal_score,
         ROUND(u.current_score::numeric, 2)::float8 AS average_score,
         u.rating_count,
         u.last_rating_timestamp::text
       FROM users u
       WHERE u.role = $1 AND (($2::text IS NULL OR $1::text = 'city') OR u.location = $2)
         AND u.rating_count >= $3
         AND COALESCE(u.settings_json::jsonb #>> '{moderation,status}', 'active') <> 'disabled'
       ORDER BY internal_score DESC NULLS LAST, u.rating_count DESC, u.last_rating_timestamp DESC NULLS LAST, u.name ASC`,
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
      ratingCount: row.rating_count,
    }));
  });
}

export async function getTargetById(id: string, options: { includeDisabled?: boolean; includeModeration?: boolean } = {}) {
  return withDb(async (db) => {
    const targetRes = await db.query<{
      id: string;
      enlive_uid: string | null;
      name: string;
      role: TargetType;
      location: string;
      genre: string | null;
      settings_json: string | null;
      current_score: number | null;
      rating_count: number;
      created_at: string;
    }>(
      `SELECT
         id, enlive_uid, name, role, location, genre, settings_json,
         current_score, rating_count, created_at
       FROM users
       WHERE id = $1 AND role IN ('venue','artist','city')`,
      [id],
    );
    const target = targetRes.rows[0];
    if (!target) return null;

    const settings = JSON.parse(target.settings_json ?? "{}") as Record<string, unknown>;
    const moderation = readProfileModeration(settings);
    if (moderation.status === "disabled" && !options.includeDisabled) return null;
    const bio = typeof settings.bio === "string" ? settings.bio : null;
    const address = readOptionalString(settings.address);
    const socialLinks = readPublicSocialLinks(settings);

    const statsRes = await db.query<{
      category_1_average: number | null;
      category_2_average: number | null;
      category_3_average: number | null;
      category_4_average: number | null;
    }>(
      `SELECT
         AVG(category_1_score)::float8 AS category_1_average,
         AVG(category_2_score)::float8 AS category_2_average,
         AVG(category_3_score)::float8 AS category_3_average,
         AVG(category_4_score)::float8 AS category_4_average
       FROM ratings
       WHERE target_id = $1`,
      [id],
    );
    const categoryStats = statsRes.rows[0];
    const cityRank = await getCityRank(db, target);
    const ratingsRes = await db.query<RatingRow>(`SELECT * FROM ratings WHERE target_id = $1 ORDER BY created_at DESC LIMIT 25`, [id]);
    const ratings = ratingsRes.rows;

    return {
      id: target.id,
      enliveUid: target.enlive_uid,
      name: target.name,
      role: target.role,
      location: target.location,
      genre: target.genre,
      bio,
      address,
      socialLinks,
      moderation: options.includeModeration ? moderation : undefined,
      createdAt: new Date(target.created_at).toISOString(),
      stats: {
        totalRatings: Number(target.rating_count),
        averageScore: target.current_score == null ? 0 : Number(target.current_score),
        category1Average: categoryStats?.category_1_average == null ? 0 : Number(categoryStats.category_1_average),
        category2Average: categoryStats?.category_2_average == null ? 0 : Number(categoryStats.category_2_average),
        category3Average: categoryStats?.category_3_average == null ? 0 : Number(categoryStats.category_3_average),
        category4Average: categoryStats?.category_4_average == null ? null : Number(categoryStats.category_4_average),
        cityRank,
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
    const values = [input.category1, input.category2, input.category3];
    if (typeof input.category4 === "number") values.push(input.category4);
    if (!values.every(isCategoryScore)) {
      return { ok: false as const, error: "Scores must be between 0 and 100." };
    }
    if (isCeilingSweepRating(values)) {
      return { ok: false as const, error: CEILING_SWEEP_ERROR };
    }

    const overall = roundScore(mean(values));
    const id = `rating-${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();

    await db.query("BEGIN");
    try {
      const targetRes = await db.query<{
        id: string;
        role: TargetType;
        location: string;
        current_score: number | null;
        denominator: number | null;
        last_rating_timestamp: string | null;
        rating_count: number | null;
        settings_json: string | null;
      }>(
        `SELECT
           id, role, location, current_score, denominator, last_rating_timestamp, rating_count, settings_json
         FROM users
         WHERE id = $1 AND role IN ('venue','artist','city')
         FOR UPDATE`,
        [input.targetId],
      );
      const target = targetRes.rows[0];
      if (!target) {
        await db.query("ROLLBACK");
        return { ok: false as const, error: "Target not found." };
      }
      const moderation = readProfileModeration(JSON.parse(target.settings_json ?? "{}") as Record<string, unknown>);
      if (moderation.status === "disabled") {
        await db.query("ROLLBACK");
        return { ok: false as const, error: "This profile is not accepting ratings right now." };
      }

      const dupRes = await db.query<{ created_at: string }>(
        `SELECT created_at FROM ratings WHERE target_id = $1 AND device_id = $2 ORDER BY created_at DESC LIMIT 1`,
        [input.targetId, input.deviceId],
      );
      const duplicate = dupRes.rows[0];
      if (duplicate && Date.now() - Date.parse(duplicate.created_at) < DUPLICATE_RATING_WINDOW_MS) {
        await db.query("ROLLBACK");
        return { ok: false as const, error: "You've already rated this profile recently." };
      }

      const aggregate = nextRatingAggregate(
        {
          currentScore: target.current_score == null ? null : Number(target.current_score),
          denominator: target.denominator == null ? null : Number(target.denominator),
          lastRatingTimestamp: target.last_rating_timestamp,
          ratingCount: target.rating_count == null ? null : Number(target.rating_count),
        },
        overall,
        createdAt,
        halfLifeDaysForRole(target.role),
      );

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

      await db.query(
        `UPDATE users
         SET
           current_score = $1,
           denominator = $2,
           last_rating_timestamp = $3,
           rating_count = $4
         WHERE id = $5`,
        [
          aggregate.currentScore,
          aggregate.denominator,
          aggregate.lastRatingTimestamp,
          aggregate.ratingCount,
          target.id,
        ],
      );

      await db.query("COMMIT");

      return {
        ok: true as const,
        rating: { id, targetId: target.id, targetType: target.role, overallScore: overall, location: target.location, createdAt },
      };
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  });
}

export async function authenticateUser(username: string, password: string) {
  return withDb(async (db) => {
    const res = await db.query<UserRow>(
      `SELECT id, enlive_uid, username, name, email, email_verified_at, password_hash, role, location, created_at, square_subscription_id
       FROM users
       WHERE lower(username) = lower($1)
       LIMIT 1`,
      [normalizeUsername(username)],
    );
    const user = res.rows[0];
    if (!user) return { ok: false as const, reason: "invalid" as const };
    if (!verifyPassword(password, user.password_hash)) {
      return { ok: false as const, reason: "invalid" as const };
    }
    if (!user.email_verified_at) {
      return { ok: false as const, reason: "unverified" as const, email: user.email };
    }
    return {
      ok: true as const,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        createdAt: new Date(user.created_at).toISOString(),
        square_subscription_id: user.square_subscription_id ?? null,
      },
    };
  });
}

export async function startLoginEmailVerification(input: {
  username: string;
  password: string;
  email: string;
}) {
  return withDb(async (db) => {
    const username = normalizeUsername(input.username);
    const email = input.email.trim().toLowerCase();
    const res = await db.query<UserRow>(
      `SELECT id, username, email, email_verified_at, password_hash, role
       FROM users
       WHERE lower(username) = lower($1)
       LIMIT 1`,
      [username],
    );
    const user = res.rows[0];
    if (!user || !verifyPassword(input.password, user.password_hash)) {
      return { ok: false as const, error: "Invalid username/password." };
    }
    if (user.email_verified_at) {
      return { ok: false as const, error: "This account is already verified." };
    }

    const emailExists = await db.query<{ id: string }>(
      `SELECT id FROM users WHERE lower(email) = lower($1) AND id <> $2 LIMIT 1`,
      [email, user.id],
    );
    if (emailExists.rows[0]) {
      return { ok: false as const, error: "Email already exists." };
    }

    const verificationToken = createEmailVerificationToken();
    const verificationTokenHash = hashEmailVerificationToken(verificationToken);
    const verificationExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

    await db.query(
      `UPDATE users
       SET email = $1,
           email_verified_at = NULL,
           email_verification_token_hash = $2,
           email_verification_expires_at = $3
       WHERE id = $4`,
      [email, verificationTokenHash, verificationExpiresAt, user.id],
    );

    return { ok: true as const, username: user.username, verificationToken };
  });
}

export async function verifyEmailToken(token: string) {
  const tokenHash = hashEmailVerificationToken(token.trim());
  return withDb(async (db) => {
    const res = await db.query<{
      id: string;
      username: string;
      role: Role;
    }>(
      `UPDATE users
       SET email_verified_at = now(),
           email_verification_token_hash = NULL,
           email_verification_expires_at = NULL
       WHERE email_verification_token_hash = $1
         AND email_verification_expires_at > now()
         AND email_verified_at IS NULL
       RETURNING id, username, role`,
      [tokenHash],
    );
    const user = res.rows[0];
    if (!user) return { ok: false as const, error: "Verification link is invalid or expired." };
    return { ok: true as const, user };
  });
}

export async function getUserById(id: string) {
  return withDb(async (db) => {
    const res = await db.query<Omit<UserRow, "password_hash">>(
      `SELECT id, enlive_uid, username, name, email, email_verified_at, role, location, created_at, square_subscription_id FROM users WHERE id = $1 LIMIT 1`,
      [id],
    );
    const user = res.rows[0];
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      emailVerified: Boolean(user.email_verified_at),
      role: user.role,
      location: user.location,
      createdAt: new Date(user.created_at).toISOString(),
      square_subscription_id: user.square_subscription_id ?? null,
    };
  });
}

export async function listUsersForAdmin() {
  return withDb(async (db) => {
    const res = await db.query<{
      id: string;
      enlive_uid: string;
      username: string;
      name: string;
      email: string | null;
      email_verified_at: string | null;
      role: TargetType;
      location: string;
      genre: string | null;
      country: string | null;
      square_subscription_id: string | null;
      settings_json: string | null;
      created_at: string;
      average_score: number | null;
      rating_count: number;
    }>(
      `SELECT
         u.id,u.enlive_uid,u.username,u.name,u.email,u.email_verified_at,u.role,u.location,u.genre,u.country,
         u.square_subscription_id,u.settings_json,u.created_at,
         ROUND(u.current_score::numeric,2)::float8 AS average_score,
         u.rating_count
       FROM users u
       WHERE u.role IN ('venue','artist','city')
       ORDER BY u.created_at DESC`,
    );

    return res.rows.map((u) => ({
      id: u.id,
      enliveUid: u.enlive_uid,
      username: u.username,
      name: u.name,
      email: u.email,
      emailVerified: Boolean(u.email_verified_at),
      role: u.role,
      location: u.location,
      genre: u.genre,
      country: u.country,
      squareSubscriptionId: u.square_subscription_id,
      moderation: readProfileModeration(JSON.parse(u.settings_json ?? "{}") as Record<string, unknown>),
      createdAt: new Date(u.created_at).toISOString(),
      averageScore: u.average_score ?? 0,
      ratingCount: u.rating_count,
    }));
  });
}

export async function setProfileModerationForAdmin(input: {
  userId: string;
  status: ProfileModerationStatus;
  reason?: string;
}) {
  return withDb(async (db) => {
    await db.query("BEGIN");
    try {
      const userRes = await db.query<{ id: string; name: string; settings_json: string | null }>(
        `SELECT id, name, settings_json
         FROM users
         WHERE id = $1 AND role IN ('venue','artist','city')
         FOR UPDATE`,
        [input.userId],
      );
      const user = userRes.rows[0];
      if (!user) {
        await db.query("ROLLBACK");
        return { ok: false as const, error: "Profile not found." };
      }

      const settings = JSON.parse(user.settings_json ?? "{}") as Record<string, unknown>;
      const moderation = {
        status: input.status,
        reason: input.status === "active" ? null : input.reason?.trim().slice(0, 200) || null,
        updatedAt: new Date().toISOString(),
      };

      await db.query(
        `UPDATE users SET settings_json = $1 WHERE id = $2`,
        [JSON.stringify(withProfileModeration(settings, moderation)), user.id],
      );

      await db.query("COMMIT");
      return { ok: true as const, userId: user.id, name: user.name, moderation };
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
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

export async function listRatingsForAdmin(params: { targetId?: string; deviceId?: string; limit?: number } = {}) {
  return withDb(async (db) => {
    const limit = Math.min(200, Math.max(1, params.limit ?? 75));
    const targetId = params.targetId?.trim() || null;
    const deviceId = params.deviceId?.trim() || null;
    const res = await db.query<{
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
      target_name: string | null;
      same_device_target_count: string;
      same_device_total_count: string;
    }>(
      `SELECT
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
         u.name AS target_name,
         (
           SELECT COUNT(*)::text
           FROM ratings same_target
           WHERE same_target.target_id = r.target_id
             AND same_target.device_id = r.device_id
         ) AS same_device_target_count,
         (
           SELECT COUNT(*)::text
           FROM ratings same_device
           WHERE same_device.device_id = r.device_id
         ) AS same_device_total_count
       FROM ratings r
       LEFT JOIN users u ON u.id = r.target_id
       WHERE ($1::text IS NULL OR r.target_id = $1)
         AND ($2::text IS NULL OR r.device_id = $2)
       ORDER BY r.created_at DESC
       LIMIT $3`,
      [targetId, deviceId, limit],
    );

    return res.rows.map((r) => ({
      id: r.id,
      targetId: r.target_id,
      targetType: r.target_type,
      category1: Number(r.category_1_score),
      category2: Number(r.category_2_score),
      category3: Number(r.category_3_score),
      category4: r.category_4_score == null ? null : Number(r.category_4_score),
      overallScore: Number(r.overall_score),
      location: r.location,
      deviceId: r.device_id,
      createdAt: new Date(r.created_at).toISOString(),
      targetName: r.target_name,
      sameDeviceTargetCount: Number(r.same_device_target_count),
      sameDeviceTotalCount: Number(r.same_device_total_count),
    }));
  });
}

async function recalculateTargetRatingAggregate(db: PoolClient, targetId: string) {
  const targetRes = await db.query<{ id: string; role: TargetType }>(
    `SELECT id, role
     FROM users
     WHERE id = $1 AND role IN ('venue','artist','city')
     FOR UPDATE`,
    [targetId],
  );
  const target = targetRes.rows[0];
  if (!target) return false;

  const ratingsRes = await db.query<Pick<RatingRow, "overall_score" | "created_at" | "id">>(
    `SELECT id, overall_score, created_at
     FROM ratings
     WHERE target_id = $1
     ORDER BY created_at ASC, id ASC`,
    [targetId],
  );

  let aggregate: {
    currentScore: number | null;
    denominator: number | null;
    lastRatingTimestamp: string | null;
    ratingCount: number | null;
  } = {
    currentScore: null,
    denominator: 0,
    lastRatingTimestamp: null,
    ratingCount: 0,
  };

  for (const rating of ratingsRes.rows) {
    aggregate = nextRatingAggregate(
      aggregate,
      Number(rating.overall_score),
      rating.created_at,
      halfLifeDaysForRole(target.role),
    );
  }

  await db.query(
    `UPDATE users
     SET current_score = $1,
         denominator = $2,
         last_rating_timestamp = $3,
         rating_count = $4
     WHERE id = $5`,
    [
      aggregate.currentScore,
      aggregate.denominator ?? 0,
      aggregate.lastRatingTimestamp,
      aggregate.ratingCount ?? 0,
      targetId,
    ],
  );

  return true;
}

export async function deleteRatingForAdmin(ratingId: string) {
  return withDb(async (db) => {
    await db.query("BEGIN");
    try {
      const deletedRes = await db.query<{ target_id: string }>(
        `DELETE FROM ratings WHERE id = $1 RETURNING target_id`,
        [ratingId],
      );
      const deleted = deletedRes.rows[0];
      if (!deleted) {
        await db.query("ROLLBACK");
        return { ok: false as const, error: "Rating not found." };
      }

      await recalculateTargetRatingAggregate(db, deleted.target_id);
      await db.query("COMMIT");
      return { ok: true as const, targetId: deleted.target_id };
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  });
}

export async function deleteTargetRatingsForAdmin(targetId: string) {
  return withDb(async (db) => {
    await db.query("BEGIN");
    try {
      const targetRes = await db.query<{ id: string; name: string }>(
        `SELECT id, name
         FROM users
         WHERE id = $1 AND role IN ('venue','artist','city')
         FOR UPDATE`,
        [targetId],
      );
      const target = targetRes.rows[0];
      if (!target) {
        await db.query("ROLLBACK");
        return { ok: false as const, error: "Target not found." };
      }

      const deletedRes = await db.query<{ count: string }>(
        `WITH deleted AS (
           DELETE FROM ratings WHERE target_id = $1 RETURNING id
         )
         SELECT COUNT(*)::text AS count FROM deleted`,
        [targetId],
      );
      await db.query(
        `UPDATE users
         SET current_score = NULL,
             denominator = 0,
             last_rating_timestamp = NULL,
             rating_count = 0
         WHERE id = $1`,
        [targetId],
      );
      await db.query("COMMIT");
      return { ok: true as const, targetId, targetName: target.name, deletedCount: Number(deletedRes.rows[0]?.count ?? 0) };
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  });
}

export async function createManagedUser(input: {
  username?: string;
  name: string;
  email?: string;
  role: TargetType;
  location?: string;
  enliveUid?: string;
  password?: string;
  genre?: string;
  settings?: Record<string, unknown>;
  emailVerified?: boolean;
}) {
  return withDb(async (db) => {
    const name = input.name.trim();
    const email = input.email?.trim().toLowerCase() || null;
    const location = input.location?.trim() ?? "";
    let username = input.username
      ? normalizeUsername(input.username)
      : await nextAvailableUsername(db, usernameBase(name, email ?? "", input.role));
    const requestedUid = input.enliveUid?.trim().toUpperCase();
    if (!name) return { ok: false as const, error: "Name is required." };
    if (!isValidUsername(username)) {
      return {
        ok: false as const,
        error: "Username must be 3-30 characters and use only letters, numbers, underscores, or hyphens.",
      };
    }
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

    if (email) {
      const exists = await db.query<{ id: string }>(`SELECT id FROM users WHERE lower(email) = lower($1)`, [email]);
      if (exists.rows[0]) return { ok: false as const, error: "Email already exists." };
    }
    const usernameExists = await db.query<{ id: string }>(`SELECT id FROM users WHERE lower(username) = lower($1)`, [username]);
    if (usernameExists.rows[0]) return { ok: false as const, error: "Username already exists." };
    const uidExists = await db.query<{ id: string }>(`SELECT id FROM users WHERE lower(enlive_uid) = lower($1)`, [enliveUid]);
    if (uidExists.rows[0]) return { ok: false as const, error: "EnLive Unique ID already exists." };

    const id = `${input.role}-${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();
    const password = input.password?.trim() || "demo123";
    const passwordHash = hashPassword(password);
    const genre = input.genre?.trim() || (input.role === 'artist' ? 'Unknown' : 'Live Music Venue');
    const settings = input.settings ?? defaultUserSettings(input.role);
    const emailVerifiedAt = input.emailVerified && email ? createdAt : null;
    const verificationToken = email && !emailVerifiedAt ? createEmailVerificationToken() : null;
    const verificationTokenHash = verificationToken ? hashEmailVerificationToken(verificationToken) : null;
    const verificationExpiresAt = verificationToken
      ? new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
      : null;

    await db.query(
      `INSERT INTO users (
        id,enlive_uid,username,name,email,email_verified_at,email_verification_token_hash,
        email_verification_expires_at,password_hash,role,location,genre,settings_json,created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        id,
        enliveUid,
        username,
        name,
        email,
        emailVerifiedAt,
        verificationTokenHash,
        verificationExpiresAt,
        passwordHash,
        input.role,
        location,
        genre,
        JSON.stringify(settings),
        createdAt,
      ],
    );

    return {
      ok: true as const,
      user: { id, enliveUid, username, name, email, role: input.role, location, createdAt, emailVerified: Boolean(emailVerifiedAt) },
      password,
      settings,
      verificationToken,
    };
  });
}

export async function updateUserProfile(id: string, input: {
  name: string;
  location: string;
  genre?: string;
  bio?: string;
  address?: string;
  website?: string;
  instagram?: string;
  tiktok?: string;
}) {
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
    const address = typeof input.address === "string"
      ? input.address.trim().slice(0, 160) || null
      : readOptionalString(existing.address);
    const existingSocialLinks = readPublicSocialLinks(existing);
    const socialLinks = {
      website: input.website === undefined ? existingSocialLinks.website : normalizePublicUrl(input.website),
      instagram: input.instagram === undefined ? existingSocialLinks.instagram : normalizePublicUrl(input.instagram),
      tiktok: input.tiktok === undefined ? existingSocialLinks.tiktok : normalizePublicUrl(input.tiktok),
    };
    const updatedSettings = JSON.stringify({ ...existing, bio, address, socialLinks });

    await db.query(
      `UPDATE users SET name = $1, location = $2, genre = $3, settings_json = $4 WHERE id = $5`,
      [name, location, input.genre?.trim() || null, updatedSettings, id],
    );
    return { ok: true as const };
  });
}

export async function clearAllRatings() {
  return withDb(async (db) => {
    await db.query("BEGIN");
    try {
      await db.query(`DELETE FROM ratings`);
      await db.query(
        `UPDATE users
         SET current_score = NULL,
             denominator = 0,
             last_rating_timestamp = NULL,
             rating_count = 0
         WHERE role IN ('venue','artist','city')`,
      );
      await db.query("COMMIT");
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
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
          `INSERT INTO users (id,enlive_uid,username,name,email,email_verified_at,password_hash,role,location,genre,country,settings_json,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [
            u.id,
            u.enlive_uid ?? u.id,
            u.username,
            u.name,
            u.email,
            u.email_verified_at ?? null,
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
