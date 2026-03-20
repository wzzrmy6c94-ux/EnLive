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
    { id: "artist-1", enlive_uid: "artist-1", name: "Neon Harbor", email: "artist1@enlive.local", password_hash: hashPassword("demo123"), role: "artist", location: "Glasgow", genre: "Synthpop", settings_json: JSON.stringify({ genre: "Synthpop", showcaseEnabled: true, socialLinks: true }), created_at: "2026-02-20T18:00:00.000Z" },
    { id: "artist-2", name: "Juno Vale", email: "artist2@enlive.local", password_hash: hashPassword("demo123"), role: "artist", location: "Blackburn", genre: "Indie Rock", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "artist-3", name: "The Midnight Echo", email: "artist3@enlive.local", password_hash: hashPassword("demo123"), role: "artist", location: "Manchester", genre: "Jazz Fusion", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "artist-4", name: "Solar Flare", email: "artist4@enlive.local", password_hash: hashPassword("demo123"), role: "artist", location: "Birmingham", genre: "Electronic", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "artist-5", name: "Velvet Underground", email: "artist5@enlive.local", password_hash: hashPassword("demo123"), role: "artist", location: "Chorley", genre: "Psych Rock", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "artist-6", name: "Luna Blue", email: "artist6@enlive.local", password_hash: hashPassword("demo123"), role: "artist", location: "Manchester", genre: "Dream Pop", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "artist-7", name: "Starlight Symphony", email: "artist7@enlive.local", password_hash: hashPassword("demo123"), role: "artist", location: "Birmingham", genre: "Classical", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "artist-8", name: "Oceania", email: "artist8@enlive.local", password_hash: hashPassword("demo123"), role: "artist", location: "Glasgow", genre: "Folk", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "artist-9", name: "Echo Canyon", email: "artist9@enlive.local", password_hash: hashPassword("demo123"), role: "artist", location: "Newcastle", genre: "Surf Rock", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "artist-10", name: "Wildwood", email: "artist10@enlive.local", password_hash: hashPassword("demo123"), role: "artist", location: "Leyland", genre: "Americana", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "artist-11", name: "Silver Lining", email: "artist11@enlive.local", password_hash: hashPassword("demo123"), role: "artist", location: "Leyland", genre: "Soul", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "artist-12", name: "The Groove Collective", email: "artist12@enlive.local", password_hash: hashPassword("demo123"), role: "artist", location: "Preston", genre: "Funk", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "artist-13", name: "Pulse", email: "artist13@enlive.local", password_hash: hashPassword("demo123"), role: "artist", location: "Blackburn", genre: "House", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "artist-14", name: "Rhythm & Blues", email: "artist14@enlive.local", password_hash: hashPassword("demo123"), role: "artist", location: "Bristol", genre: "Blues", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "artist-15", name: "The Wanderers", email: "artist15@enlive.local", password_hash: hashPassword("demo123"), role: "artist", location: "Glasgow", genre: "Alternative", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "venue-1", name: "The Crown Social", email: "venue1@enlive.local", password_hash: hashPassword("demo123"), role: "venue", location: "Birmingham", genre: "Live Music Venue", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "venue-2", name: "River Room", email: "venue2@enlive.local", password_hash: hashPassword("demo123"), role: "venue", location: "Leeds", genre: "Live Music Venue", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "venue-3", name: "The Grand Stage", email: "venue3@enlive.local", password_hash: hashPassword("demo123"), role: "venue", location: "Bristol", genre: "Live Music Venue", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "venue-4", name: "Blue Note", email: "venue4@enlive.local", password_hash: hashPassword("demo123"), role: "venue", location: "Leyland", genre: "Live Music Venue", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "venue-5", name: "Acoustic Attic", email: "venue5@enlive.local", password_hash: hashPassword("demo123"), role: "venue", location: "Preston", genre: "Live Music Venue", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "venue-6", name: "The Sound House", email: "venue6@enlive.local", password_hash: hashPassword("demo123"), role: "venue", location: "Newcastle", genre: "Live Music Venue", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "venue-7", name: "Vibe Central", email: "venue7@enlive.local", password_hash: hashPassword("demo123"), role: "venue", location: "Bristol", genre: "Live Music Venue", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "venue-8", name: "Melody Mansion", email: "venue8@enlive.local", password_hash: hashPassword("demo123"), role: "venue", location: "Sheffield", genre: "Live Music Venue", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "venue-9", name: "The Basement", email: "venue9@enlive.local", password_hash: hashPassword("demo123"), role: "venue", location: "Glasgow", genre: "Live Music Venue", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "venue-10", name: "Sky Lounge", email: "venue10@enlive.local", password_hash: hashPassword("demo123"), role: "venue", location: "Bolton", genre: "Live Music Venue", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "venue-11", name: "Harbor Lights", email: "venue11@enlive.local", password_hash: hashPassword("demo123"), role: "venue", location: "Newcastle", genre: "Live Music Venue", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "venue-12", name: "The Junction", email: "venue12@enlive.local", password_hash: hashPassword("demo123"), role: "venue", location: "Chorley", genre: "Live Music Venue", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "venue-13", name: "Electric Alley", email: "venue13@enlive.local", password_hash: hashPassword("demo123"), role: "venue", location: "Glasgow", genre: "Live Music Venue", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "venue-14", name: "Harmony Hall", email: "venue14@enlive.local", password_hash: hashPassword("demo123"), role: "venue", location: "Glasgow", genre: "Live Music Venue", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "venue-15", name: "The Workshop", email: "venue15@enlive.local", password_hash: hashPassword("demo123"), role: "venue", location: "Leyland", genre: "Live Music Venue", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "city-1", name: "Chorley", email: "city1@enlive.local", password_hash: hashPassword("demo123"), role: "city", location: "Chorley", genre: "City", country: "United Kingdom", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "city-2", name: "Preston", email: "city2@enlive.local", password_hash: hashPassword("demo123"), role: "city", location: "Preston", genre: "City", country: "United Kingdom", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "city-3", name: "Leyland", email: "city3@enlive.local", password_hash: hashPassword("demo123"), role: "city", location: "Leyland", genre: "City", country: "United Kingdom", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "city-4", name: "Blackburn", email: "city4@enlive.local", password_hash: hashPassword("demo123"), role: "city", location: "Blackburn", genre: "City", country: "United Kingdom", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "city-5", name: "Bolton", email: "city5@enlive.local", password_hash: hashPassword("demo123"), role: "city", location: "Bolton", genre: "City", country: "United Kingdom", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "city-6", name: "Wigan", email: "city6@enlive.local", password_hash: hashPassword("demo123"), role: "city", location: "Wigan", genre: "City", country: "United Kingdom", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "city-7", name: "Manchester", email: "city7@enlive.local", password_hash: hashPassword("demo123"), role: "city", location: "Manchester", genre: "City", country: "United Kingdom", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "city-8", name: "Liverpool", email: "city8@enlive.local", password_hash: hashPassword("demo123"), role: "city", location: "Liverpool", genre: "City", country: "United Kingdom", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "city-9", name: "Leeds", email: "city9@enlive.local", password_hash: hashPassword("demo123"), role: "city", location: "Leeds", genre: "City", country: "United Kingdom", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "city-10", name: "Sheffield", email: "city10@enlive.local", password_hash: hashPassword("demo123"), role: "city", location: "Sheffield", genre: "City", country: "United Kingdom", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "city-11", name: "Newcastle", email: "city11@enlive.local", password_hash: hashPassword("demo123"), role: "city", location: "Newcastle", genre: "City", country: "United Kingdom", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "city-12", name: "London", email: "city12@enlive.local", password_hash: hashPassword("demo123"), role: "city", location: "London", genre: "City", country: "United Kingdom", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "city-13", name: "Birmingham", email: "city13@enlive.local", password_hash: hashPassword("demo123"), role: "city", location: "Birmingham", genre: "City", country: "United Kingdom", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "city-14", name: "Bristol", email: "city14@enlive.local", password_hash: hashPassword("demo123"), role: "city", location: "Bristol", genre: "City", country: "United Kingdom", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "city-15", name: "Glasgow", email: "city15@enlive.local", password_hash: hashPassword("demo123"), role: "city", location: "Glasgow", genre: "City", country: "United Kingdom", created_at: "2026-02-20T18:00:00.000Z" },
    { id: "admin-enlive", enlive_uid: "admin-enlive", name: "Enlive Admin", email: "admin@enlive.local", password_hash: hashPassword("secret123"), role: "admin", location: "Chorley", genre: "Admin", settings_json: JSON.stringify({}), created_at: "2026-02-20T18:00:00.000Z" },
  ];
}

function seedRatings(): RatingRow[] {
  return [
    { id: "r-a-1-1", target_id: "artist-1", target_type: "artist", category_1_score: 4, category_2_score: 4, category_3_score: 4, category_4_score: 3, overall_score: 75.0, location: "Glasgow", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-1-2", target_id: "artist-1", target_type: "artist", category_1_score: 5, category_2_score: 4, category_3_score: 3, category_4_score: 4, overall_score: 80.0, location: "Glasgow", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-1-3", target_id: "artist-1", target_type: "artist", category_1_score: 3, category_2_score: 3, category_3_score: 4, category_4_score: 4, overall_score: 70.0, location: "Glasgow", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-2-1", target_id: "artist-2", target_type: "artist", category_1_score: 5, category_2_score: 3, category_3_score: 4, category_4_score: 4, overall_score: 80.0, location: "Blackburn", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-2-2", target_id: "artist-2", target_type: "artist", category_1_score: 3, category_2_score: 3, category_3_score: 3, category_4_score: 3, overall_score: 60.0, location: "Blackburn", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-2-3", target_id: "artist-2", target_type: "artist", category_1_score: 5, category_2_score: 5, category_3_score: 3, category_4_score: 3, overall_score: 80.0, location: "Blackburn", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-3-1", target_id: "artist-3", target_type: "artist", category_1_score: 4, category_2_score: 3, category_3_score: 3, category_4_score: 4, overall_score: 70.0, location: "Manchester", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-3-2", target_id: "artist-3", target_type: "artist", category_1_score: 5, category_2_score: 5, category_3_score: 3, category_4_score: 4, overall_score: 85.0, location: "Manchester", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-3-3", target_id: "artist-3", target_type: "artist", category_1_score: 5, category_2_score: 4, category_3_score: 5, category_4_score: 5, overall_score: 95.0, location: "Manchester", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-4-1", target_id: "artist-4", target_type: "artist", category_1_score: 5, category_2_score: 5, category_3_score: 3, category_4_score: 3, overall_score: 80.0, location: "Birmingham", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-4-2", target_id: "artist-4", target_type: "artist", category_1_score: 4, category_2_score: 4, category_3_score: 3, category_4_score: 4, overall_score: 75.0, location: "Birmingham", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-4-3", target_id: "artist-4", target_type: "artist", category_1_score: 4, category_2_score: 3, category_3_score: 5, category_4_score: 3, overall_score: 75.0, location: "Birmingham", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-5-1", target_id: "artist-5", target_type: "artist", category_1_score: 5, category_2_score: 5, category_3_score: 4, category_4_score: 3, overall_score: 85.0, location: "Chorley", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-5-2", target_id: "artist-5", target_type: "artist", category_1_score: 3, category_2_score: 4, category_3_score: 5, category_4_score: 3, overall_score: 75.0, location: "Chorley", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-5-3", target_id: "artist-5", target_type: "artist", category_1_score: 5, category_2_score: 3, category_3_score: 5, category_4_score: 5, overall_score: 90.0, location: "Chorley", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-6-1", target_id: "artist-6", target_type: "artist", category_1_score: 5, category_2_score: 4, category_3_score: 3, category_4_score: 4, overall_score: 80.0, location: "Manchester", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-6-2", target_id: "artist-6", target_type: "artist", category_1_score: 4, category_2_score: 3, category_3_score: 4, category_4_score: 3, overall_score: 70.0, location: "Manchester", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-6-3", target_id: "artist-6", target_type: "artist", category_1_score: 3, category_2_score: 3, category_3_score: 5, category_4_score: 4, overall_score: 75.0, location: "Manchester", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-7-1", target_id: "artist-7", target_type: "artist", category_1_score: 4, category_2_score: 4, category_3_score: 4, category_4_score: 4, overall_score: 80.0, location: "Birmingham", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-7-2", target_id: "artist-7", target_type: "artist", category_1_score: 3, category_2_score: 4, category_3_score: 3, category_4_score: 3, overall_score: 65.0, location: "Birmingham", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-7-3", target_id: "artist-7", target_type: "artist", category_1_score: 4, category_2_score: 4, category_3_score: 5, category_4_score: 4, overall_score: 85.0, location: "Birmingham", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-8-1", target_id: "artist-8", target_type: "artist", category_1_score: 5, category_2_score: 3, category_3_score: 3, category_4_score: 5, overall_score: 80.0, location: "Glasgow", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-8-2", target_id: "artist-8", target_type: "artist", category_1_score: 3, category_2_score: 3, category_3_score: 5, category_4_score: 4, overall_score: 75.0, location: "Glasgow", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-8-3", target_id: "artist-8", target_type: "artist", category_1_score: 4, category_2_score: 5, category_3_score: 4, category_4_score: 5, overall_score: 90.0, location: "Glasgow", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-9-1", target_id: "artist-9", target_type: "artist", category_1_score: 3, category_2_score: 3, category_3_score: 5, category_4_score: 5, overall_score: 80.0, location: "Newcastle", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-9-2", target_id: "artist-9", target_type: "artist", category_1_score: 5, category_2_score: 3, category_3_score: 5, category_4_score: 3, overall_score: 80.0, location: "Newcastle", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-9-3", target_id: "artist-9", target_type: "artist", category_1_score: 5, category_2_score: 3, category_3_score: 3, category_4_score: 4, overall_score: 75.0, location: "Newcastle", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-10-1", target_id: "artist-10", target_type: "artist", category_1_score: 3, category_2_score: 4, category_3_score: 3, category_4_score: 5, overall_score: 75.0, location: "Leyland", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-10-2", target_id: "artist-10", target_type: "artist", category_1_score: 4, category_2_score: 3, category_3_score: 4, category_4_score: 4, overall_score: 75.0, location: "Leyland", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-10-3", target_id: "artist-10", target_type: "artist", category_1_score: 5, category_2_score: 4, category_3_score: 3, category_4_score: 4, overall_score: 80.0, location: "Leyland", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-11-1", target_id: "artist-11", target_type: "artist", category_1_score: 3, category_2_score: 4, category_3_score: 3, category_4_score: 5, overall_score: 75.0, location: "Leyland", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-11-2", target_id: "artist-11", target_type: "artist", category_1_score: 4, category_2_score: 4, category_3_score: 4, category_4_score: 4, overall_score: 80.0, location: "Leyland", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-11-3", target_id: "artist-11", target_type: "artist", category_1_score: 4, category_2_score: 3, category_3_score: 3, category_4_score: 3, overall_score: 65.0, location: "Leyland", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-12-1", target_id: "artist-12", target_type: "artist", category_1_score: 3, category_2_score: 4, category_3_score: 3, category_4_score: 4, overall_score: 70.0, location: "Preston", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-12-2", target_id: "artist-12", target_type: "artist", category_1_score: 4, category_2_score: 3, category_3_score: 4, category_4_score: 5, overall_score: 80.0, location: "Preston", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-12-3", target_id: "artist-12", target_type: "artist", category_1_score: 5, category_2_score: 3, category_3_score: 3, category_4_score: 5, overall_score: 80.0, location: "Preston", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-13-1", target_id: "artist-13", target_type: "artist", category_1_score: 3, category_2_score: 3, category_3_score: 4, category_4_score: 5, overall_score: 75.0, location: "Blackburn", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-13-2", target_id: "artist-13", target_type: "artist", category_1_score: 4, category_2_score: 5, category_3_score: 3, category_4_score: 3, overall_score: 75.0, location: "Blackburn", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-13-3", target_id: "artist-13", target_type: "artist", category_1_score: 4, category_2_score: 4, category_3_score: 4, category_4_score: 3, overall_score: 75.0, location: "Blackburn", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-14-1", target_id: "artist-14", target_type: "artist", category_1_score: 5, category_2_score: 4, category_3_score: 5, category_4_score: 3, overall_score: 85.0, location: "Bristol", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-14-2", target_id: "artist-14", target_type: "artist", category_1_score: 5, category_2_score: 3, category_3_score: 3, category_4_score: 5, overall_score: 80.0, location: "Bristol", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-14-3", target_id: "artist-14", target_type: "artist", category_1_score: 3, category_2_score: 4, category_3_score: 5, category_4_score: 3, overall_score: 75.0, location: "Bristol", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-15-1", target_id: "artist-15", target_type: "artist", category_1_score: 4, category_2_score: 3, category_3_score: 4, category_4_score: 5, overall_score: 80.0, location: "Glasgow", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-15-2", target_id: "artist-15", target_type: "artist", category_1_score: 3, category_2_score: 4, category_3_score: 5, category_4_score: 5, overall_score: 85.0, location: "Glasgow", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-a-15-3", target_id: "artist-15", target_type: "artist", category_1_score: 3, category_2_score: 3, category_3_score: 5, category_4_score: 3, overall_score: 70.0, location: "Glasgow", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-1-1", target_id: "venue-1", target_type: "venue", category_1_score: 4, category_2_score: 4, category_3_score: 5, category_4_score: 5, overall_score: 90.0, location: "Birmingham", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-1-2", target_id: "venue-1", target_type: "venue", category_1_score: 5, category_2_score: 3, category_3_score: 4, category_4_score: 4, overall_score: 80.0, location: "Birmingham", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-1-3", target_id: "venue-1", target_type: "venue", category_1_score: 5, category_2_score: 5, category_3_score: 3, category_4_score: 5, overall_score: 90.0, location: "Birmingham", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-2-1", target_id: "venue-2", target_type: "venue", category_1_score: 3, category_2_score: 5, category_3_score: 3, category_4_score: 3, overall_score: 70.0, location: "Leeds", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-2-2", target_id: "venue-2", target_type: "venue", category_1_score: 4, category_2_score: 5, category_3_score: 4, category_4_score: 4, overall_score: 85.0, location: "Leeds", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-2-3", target_id: "venue-2", target_type: "venue", category_1_score: 5, category_2_score: 3, category_3_score: 3, category_4_score: 3, overall_score: 70.0, location: "Leeds", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-3-1", target_id: "venue-3", target_type: "venue", category_1_score: 3, category_2_score: 4, category_3_score: 3, category_4_score: 3, overall_score: 65.0, location: "Bristol", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-3-2", target_id: "venue-3", target_type: "venue", category_1_score: 3, category_2_score: 4, category_3_score: 3, category_4_score: 4, overall_score: 70.0, location: "Bristol", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-3-3", target_id: "venue-3", target_type: "venue", category_1_score: 5, category_2_score: 5, category_3_score: 4, category_4_score: 4, overall_score: 90.0, location: "Bristol", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-4-1", target_id: "venue-4", target_type: "venue", category_1_score: 3, category_2_score: 4, category_3_score: 3, category_4_score: 4, overall_score: 70.0, location: "Leyland", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-4-2", target_id: "venue-4", target_type: "venue", category_1_score: 5, category_2_score: 5, category_3_score: 4, category_4_score: 4, overall_score: 90.0, location: "Leyland", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-4-3", target_id: "venue-4", target_type: "venue", category_1_score: 4, category_2_score: 5, category_3_score: 4, category_4_score: 4, overall_score: 85.0, location: "Leyland", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-5-1", target_id: "venue-5", target_type: "venue", category_1_score: 5, category_2_score: 5, category_3_score: 5, category_4_score: 5, overall_score: 100.0, location: "Preston", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-5-2", target_id: "venue-5", target_type: "venue", category_1_score: 4, category_2_score: 5, category_3_score: 4, category_4_score: 4, overall_score: 85.0, location: "Preston", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-5-3", target_id: "venue-5", target_type: "venue", category_1_score: 5, category_2_score: 4, category_3_score: 3, category_4_score: 4, overall_score: 80.0, location: "Preston", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-6-1", target_id: "venue-6", target_type: "venue", category_1_score: 3, category_2_score: 4, category_3_score: 4, category_4_score: 5, overall_score: 80.0, location: "Newcastle", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-6-2", target_id: "venue-6", target_type: "venue", category_1_score: 3, category_2_score: 4, category_3_score: 5, category_4_score: 3, overall_score: 75.0, location: "Newcastle", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-6-3", target_id: "venue-6", target_type: "venue", category_1_score: 5, category_2_score: 3, category_3_score: 4, category_4_score: 4, overall_score: 80.0, location: "Newcastle", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-7-1", target_id: "venue-7", target_type: "venue", category_1_score: 3, category_2_score: 3, category_3_score: 5, category_4_score: 5, overall_score: 80.0, location: "Bristol", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-7-2", target_id: "venue-7", target_type: "venue", category_1_score: 5, category_2_score: 3, category_3_score: 5, category_4_score: 4, overall_score: 85.0, location: "Bristol", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-7-3", target_id: "venue-7", target_type: "venue", category_1_score: 4, category_2_score: 3, category_3_score: 5, category_4_score: 5, overall_score: 85.0, location: "Bristol", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-8-1", target_id: "venue-8", target_type: "venue", category_1_score: 3, category_2_score: 5, category_3_score: 5, category_4_score: 3, overall_score: 80.0, location: "Sheffield", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-8-2", target_id: "venue-8", target_type: "venue", category_1_score: 5, category_2_score: 5, category_3_score: 5, category_4_score: 4, overall_score: 95.0, location: "Sheffield", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-8-3", target_id: "venue-8", target_type: "venue", category_1_score: 3, category_2_score: 5, category_3_score: 5, category_4_score: 4, overall_score: 85.0, location: "Sheffield", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-9-1", target_id: "venue-9", target_type: "venue", category_1_score: 3, category_2_score: 4, category_3_score: 5, category_4_score: 5, overall_score: 85.0, location: "Glasgow", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-9-2", target_id: "venue-9", target_type: "venue", category_1_score: 3, category_2_score: 5, category_3_score: 4, category_4_score: 4, overall_score: 80.0, location: "Glasgow", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-9-3", target_id: "venue-9", target_type: "venue", category_1_score: 3, category_2_score: 3, category_3_score: 3, category_4_score: 3, overall_score: 60.0, location: "Glasgow", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-10-1", target_id: "venue-10", target_type: "venue", category_1_score: 5, category_2_score: 3, category_3_score: 5, category_4_score: 4, overall_score: 85.0, location: "Bolton", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-10-2", target_id: "venue-10", target_type: "venue", category_1_score: 5, category_2_score: 3, category_3_score: 4, category_4_score: 4, overall_score: 80.0, location: "Bolton", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-10-3", target_id: "venue-10", target_type: "venue", category_1_score: 4, category_2_score: 3, category_3_score: 3, category_4_score: 5, overall_score: 75.0, location: "Bolton", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-11-1", target_id: "venue-11", target_type: "venue", category_1_score: 4, category_2_score: 3, category_3_score: 5, category_4_score: 5, overall_score: 85.0, location: "Newcastle", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-11-2", target_id: "venue-11", target_type: "venue", category_1_score: 4, category_2_score: 5, category_3_score: 5, category_4_score: 4, overall_score: 90.0, location: "Newcastle", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-11-3", target_id: "venue-11", target_type: "venue", category_1_score: 3, category_2_score: 5, category_3_score: 4, category_4_score: 4, overall_score: 80.0, location: "Newcastle", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-12-1", target_id: "venue-12", target_type: "venue", category_1_score: 4, category_2_score: 5, category_3_score: 3, category_4_score: 3, overall_score: 75.0, location: "Chorley", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-12-2", target_id: "venue-12", target_type: "venue", category_1_score: 5, category_2_score: 5, category_3_score: 3, category_4_score: 5, overall_score: 90.0, location: "Chorley", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-12-3", target_id: "venue-12", target_type: "venue", category_1_score: 4, category_2_score: 4, category_3_score: 3, category_4_score: 4, overall_score: 75.0, location: "Chorley", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-13-1", target_id: "venue-13", target_type: "venue", category_1_score: 3, category_2_score: 5, category_3_score: 5, category_4_score: 3, overall_score: 80.0, location: "Glasgow", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-13-2", target_id: "venue-13", target_type: "venue", category_1_score: 4, category_2_score: 5, category_3_score: 3, category_4_score: 4, overall_score: 80.0, location: "Glasgow", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-13-3", target_id: "venue-13", target_type: "venue", category_1_score: 3, category_2_score: 4, category_3_score: 3, category_4_score: 3, overall_score: 65.0, location: "Glasgow", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-14-1", target_id: "venue-14", target_type: "venue", category_1_score: 3, category_2_score: 5, category_3_score: 4, category_4_score: 4, overall_score: 80.0, location: "Glasgow", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-14-2", target_id: "venue-14", target_type: "venue", category_1_score: 5, category_2_score: 5, category_3_score: 5, category_4_score: 4, overall_score: 95.0, location: "Glasgow", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-14-3", target_id: "venue-14", target_type: "venue", category_1_score: 3, category_2_score: 3, category_3_score: 3, category_4_score: 3, overall_score: 60.0, location: "Glasgow", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-15-1", target_id: "venue-15", target_type: "venue", category_1_score: 3, category_2_score: 4, category_3_score: 3, category_4_score: 3, overall_score: 65.0, location: "Leyland", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-15-2", target_id: "venue-15", target_type: "venue", category_1_score: 5, category_2_score: 3, category_3_score: 5, category_4_score: 4, overall_score: 85.0, location: "Leyland", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-v-15-3", target_id: "venue-15", target_type: "venue", category_1_score: 3, category_2_score: 4, category_3_score: 4, category_4_score: 3, overall_score: 70.0, location: "Leyland", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-1-1", target_id: "city-1", target_type: "city", category_1_score: 5, category_2_score: 4, category_3_score: 4, category_4_score: 5, overall_score: 90.0, location: "Chorley", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-1-2", target_id: "city-1", target_type: "city", category_1_score: 4, category_2_score: 4, category_3_score: 3, category_4_score: 4, overall_score: 75.0, location: "Chorley", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-1-3", target_id: "city-1", target_type: "city", category_1_score: 3, category_2_score: 5, category_3_score: 5, category_4_score: 3, overall_score: 80.0, location: "Chorley", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-2-1", target_id: "city-2", target_type: "city", category_1_score: 5, category_2_score: 4, category_3_score: 5, category_4_score: 3, overall_score: 85.0, location: "Preston", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-2-2", target_id: "city-2", target_type: "city", category_1_score: 4, category_2_score: 3, category_3_score: 5, category_4_score: 3, overall_score: 75.0, location: "Preston", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-2-3", target_id: "city-2", target_type: "city", category_1_score: 3, category_2_score: 3, category_3_score: 5, category_4_score: 3, overall_score: 70.0, location: "Preston", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-3-1", target_id: "city-3", target_type: "city", category_1_score: 3, category_2_score: 3, category_3_score: 3, category_4_score: 4, overall_score: 65.0, location: "Leyland", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-3-2", target_id: "city-3", target_type: "city", category_1_score: 3, category_2_score: 3, category_3_score: 4, category_4_score: 3, overall_score: 65.0, location: "Leyland", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-3-3", target_id: "city-3", target_type: "city", category_1_score: 5, category_2_score: 4, category_3_score: 3, category_4_score: 3, overall_score: 75.0, location: "Leyland", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-4-1", target_id: "city-4", target_type: "city", category_1_score: 5, category_2_score: 4, category_3_score: 4, category_4_score: 4, overall_score: 85.0, location: "Blackburn", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-4-2", target_id: "city-4", target_type: "city", category_1_score: 5, category_2_score: 5, category_3_score: 3, category_4_score: 4, overall_score: 85.0, location: "Blackburn", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-4-3", target_id: "city-4", target_type: "city", category_1_score: 4, category_2_score: 4, category_3_score: 3, category_4_score: 3, overall_score: 70.0, location: "Blackburn", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-5-1", target_id: "city-5", target_type: "city", category_1_score: 4, category_2_score: 3, category_3_score: 4, category_4_score: 5, overall_score: 80.0, location: "Bolton", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-5-2", target_id: "city-5", target_type: "city", category_1_score: 5, category_2_score: 3, category_3_score: 4, category_4_score: 4, overall_score: 80.0, location: "Bolton", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-5-3", target_id: "city-5", target_type: "city", category_1_score: 3, category_2_score: 5, category_3_score: 4, category_4_score: 5, overall_score: 85.0, location: "Bolton", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-6-1", target_id: "city-6", target_type: "city", category_1_score: 5, category_2_score: 4, category_3_score: 5, category_4_score: 3, overall_score: 85.0, location: "Wigan", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-6-2", target_id: "city-6", target_type: "city", category_1_score: 5, category_2_score: 3, category_3_score: 5, category_4_score: 3, overall_score: 80.0, location: "Wigan", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-6-3", target_id: "city-6", target_type: "city", category_1_score: 5, category_2_score: 5, category_3_score: 4, category_4_score: 4, overall_score: 90.0, location: "Wigan", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-7-1", target_id: "city-7", target_type: "city", category_1_score: 3, category_2_score: 3, category_3_score: 3, category_4_score: 4, overall_score: 65.0, location: "Manchester", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-7-2", target_id: "city-7", target_type: "city", category_1_score: 4, category_2_score: 3, category_3_score: 5, category_4_score: 3, overall_score: 75.0, location: "Manchester", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-7-3", target_id: "city-7", target_type: "city", category_1_score: 3, category_2_score: 3, category_3_score: 4, category_4_score: 3, overall_score: 65.0, location: "Manchester", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-8-1", target_id: "city-8", target_type: "city", category_1_score: 3, category_2_score: 3, category_3_score: 4, category_4_score: 3, overall_score: 65.0, location: "Liverpool", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-8-2", target_id: "city-8", target_type: "city", category_1_score: 5, category_2_score: 3, category_3_score: 4, category_4_score: 4, overall_score: 80.0, location: "Liverpool", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-8-3", target_id: "city-8", target_type: "city", category_1_score: 3, category_2_score: 3, category_3_score: 5, category_4_score: 4, overall_score: 75.0, location: "Liverpool", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-9-1", target_id: "city-9", target_type: "city", category_1_score: 5, category_2_score: 5, category_3_score: 3, category_4_score: 4, overall_score: 85.0, location: "Leeds", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-9-2", target_id: "city-9", target_type: "city", category_1_score: 4, category_2_score: 3, category_3_score: 3, category_4_score: 4, overall_score: 70.0, location: "Leeds", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-9-3", target_id: "city-9", target_type: "city", category_1_score: 5, category_2_score: 4, category_3_score: 4, category_4_score: 3, overall_score: 80.0, location: "Leeds", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-10-1", target_id: "city-10", target_type: "city", category_1_score: 4, category_2_score: 5, category_3_score: 5, category_4_score: 5, overall_score: 95.0, location: "Sheffield", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-10-2", target_id: "city-10", target_type: "city", category_1_score: 3, category_2_score: 4, category_3_score: 3, category_4_score: 4, overall_score: 70.0, location: "Sheffield", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-10-3", target_id: "city-10", target_type: "city", category_1_score: 5, category_2_score: 3, category_3_score: 5, category_4_score: 3, overall_score: 80.0, location: "Sheffield", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-11-1", target_id: "city-11", target_type: "city", category_1_score: 4, category_2_score: 3, category_3_score: 5, category_4_score: 4, overall_score: 80.0, location: "Newcastle", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-11-2", target_id: "city-11", target_type: "city", category_1_score: 4, category_2_score: 3, category_3_score: 3, category_4_score: 5, overall_score: 75.0, location: "Newcastle", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-11-3", target_id: "city-11", target_type: "city", category_1_score: 5, category_2_score: 5, category_3_score: 5, category_4_score: 3, overall_score: 90.0, location: "Newcastle", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-12-1", target_id: "city-12", target_type: "city", category_1_score: 3, category_2_score: 3, category_3_score: 4, category_4_score: 3, overall_score: 65.0, location: "London", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-12-2", target_id: "city-12", target_type: "city", category_1_score: 3, category_2_score: 3, category_3_score: 4, category_4_score: 4, overall_score: 70.0, location: "London", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-12-3", target_id: "city-12", target_type: "city", category_1_score: 5, category_2_score: 3, category_3_score: 5, category_4_score: 3, overall_score: 80.0, location: "London", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-13-1", target_id: "city-13", target_type: "city", category_1_score: 3, category_2_score: 3, category_3_score: 4, category_4_score: 3, overall_score: 65.0, location: "Birmingham", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-13-2", target_id: "city-13", target_type: "city", category_1_score: 3, category_2_score: 4, category_3_score: 4, category_4_score: 4, overall_score: 75.0, location: "Birmingham", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-13-3", target_id: "city-13", target_type: "city", category_1_score: 3, category_2_score: 4, category_3_score: 3, category_4_score: 4, overall_score: 70.0, location: "Birmingham", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-14-1", target_id: "city-14", target_type: "city", category_1_score: 5, category_2_score: 3, category_3_score: 4, category_4_score: 3, overall_score: 75.0, location: "Bristol", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-14-2", target_id: "city-14", target_type: "city", category_1_score: 3, category_2_score: 5, category_3_score: 5, category_4_score: 5, overall_score: 90.0, location: "Bristol", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-14-3", target_id: "city-14", target_type: "city", category_1_score: 5, category_2_score: 5, category_3_score: 5, category_4_score: 4, overall_score: 95.0, location: "Bristol", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-15-1", target_id: "city-15", target_type: "city", category_1_score: 3, category_2_score: 3, category_3_score: 5, category_4_score: 5, overall_score: 80.0, location: "Glasgow", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-15-2", target_id: "city-15", target_type: "city", category_1_score: 4, category_2_score: 4, category_3_score: 3, category_4_score: 3, overall_score: 70.0, location: "Glasgow", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
    { id: "r-c-15-3", target_id: "city-15", target_type: "city", category_1_score: 3, category_2_score: 3, category_3_score: 3, category_4_score: 4, overall_score: 65.0, location: "Glasgow", device_id: "seed-device", created_at: "2026-02-21T19:00:00.000Z" },
  ];
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
      name: string;
      role: TargetType;
      location: string;
      created_at: string;
    }>(`SELECT id, name, role, location, created_at FROM users WHERE id = $1 AND role IN ('venue','artist','city')`, [id]);
    const target = targetRes.rows[0];
    if (!target) return null;

    const ratingsRes = await db.query<RatingRow>(`SELECT * FROM ratings WHERE target_id = $1 ORDER BY created_at DESC LIMIT 25`, [id]);
    const ratings = ratingsRes.rows;
    const c4 = ratings.map((r) => r.category_4_score).filter((v): v is number => typeof v === "number");

    return {
      ...target,
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
  location: string;
  enliveUid?: string;
  password?: string;
  genre?: string;
  settings?: Record<string, unknown>;
}) {
  return withDb(async (db) => {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const location = input.location.trim();
    const requestedUid = input.enliveUid?.trim().toUpperCase();
    if (!name || !email || !location) return { ok: false as const, error: "Name, email and town are required." };
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

export async function updateUserProfile(id: string, input: { name: string; location: string; genre?: string }) {
  return withDb(async (db) => {
    const name = input.name.trim();
    const location = input.location.trim();
    if (!name || !location) return { ok: false as const, error: "Name and location are required." };
    await db.query(
      `UPDATE users SET name = $1, location = $2, genre = $3 WHERE id = $4`,
      [name, location, input.genre?.trim() || null, id],
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
