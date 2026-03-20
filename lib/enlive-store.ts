"use client";

export type Role = "venue" | "artist" | "admin";
export type TargetType = "venue" | "artist";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  location: string;
  createdAt: string;
};

export type Rating = {
  id: string;
  targetId: string;
  targetType: TargetType;
  category1: number;
  category2: number;
  category3: number;
  category4?: number;
  overallScore: number;
  location: string;
  deviceId: string;
  createdAt: string;
};

export type Db = {
  users: User[];
  ratings: Rating[];
};

export type LeaderboardEntry = {
  user: User;
  averageScore: number;
  ratingCount: number;
};

export type UserStats = {
  totalRatings: number;
  averageScore: number;
  category1Average: number;
  category2Average: number;
  category3Average: number;
  category4Average: number | null;
};

const DB_KEY = "enlive:mvp-db";
const SESSION_KEY = "enlive:session-user-id";
const DEVICE_KEY = "enlive:device-id";
const DUPLICATE_WINDOW_MS = 60_000;

export const SCORE_SCALE = { min: 1, max: 5 } as const;

function toHundredPointScore(value: number) {
  return round((value / SCORE_SCALE.max) * 100);
}

export const CATEGORY_LABELS = [
  "Sound",
  "Atmosphere",
  "Stage Presence",
  "Value (optional)",
] as const;

const seedUsers: User[] = [
  {
    id: "venue-crown-social",
    name: "The Crown Social",
    email: "crown@enlive.local",
    password: "demo123",
    role: "venue",
    location: "Chorley",
    createdAt: "2026-02-20T18:00:00.000Z",
  },
  {
    id: "venue-river-room",
    name: "River Room",
    email: "river@enlive.local",
    password: "demo123",
    role: "venue",
    location: "Preston",
    createdAt: "2026-02-20T18:10:00.000Z",
  },
  {
    id: "artist-neon-harbor",
    name: "Neon Harbor",
    email: "neon@enlive.local",
    password: "demo123",
    role: "artist",
    location: "Chorley",
    createdAt: "2026-02-20T18:20:00.000Z",
  },
  {
    id: "artist-juno-vale",
    name: "Juno Vale",
    email: "juno@enlive.local",
    password: "demo123",
    role: "artist",
    location: "Preston",
    createdAt: "2026-02-20T18:25:00.000Z",
  },
  {
    id: "admin-enlive",
    name: "Enlive Admin",
    email: "admin@enlive.local",
    password: "secret123",
    role: "admin",
    location: "Chorley",
    createdAt: "2026-02-20T18:30:00.000Z",
  },
];

const seedRatings: Rating[] = [
  {
    id: "r-1",
    targetId: "venue-crown-social",
    targetType: "venue",
    category1: 5,
    category2: 4,
    category3: 4,
    category4: 4,
    overallScore: 85,
    location: "Chorley",
    deviceId: "seed-device-a",
    createdAt: "2026-02-21T19:10:00.000Z",
  },
  {
    id: "r-2",
    targetId: "venue-crown-social",
    targetType: "venue",
    category1: 4,
    category2: 5,
    category3: 4,
    category4: 5,
    overallScore: 90,
    location: "Chorley",
    deviceId: "seed-device-b",
    createdAt: "2026-02-21T19:20:00.000Z",
  },
  {
    id: "r-3",
    targetId: "artist-neon-harbor",
    targetType: "artist",
    category1: 5,
    category2: 5,
    category3: 5,
    category4: 4,
    overallScore: 95,
    location: "Chorley",
    deviceId: "seed-device-c",
    createdAt: "2026-02-22T20:00:00.000Z",
  },
  {
    id: "r-4",
    targetId: "venue-river-room",
    targetType: "venue",
    category1: 4,
    category2: 4,
    category3: 3,
    overallScore: 73.4,
    location: "Preston",
    deviceId: "seed-device-d",
    createdAt: "2026-02-22T21:00:00.000Z",
  },
  {
    id: "r-5",
    targetId: "artist-juno-vale",
    targetType: "artist",
    category1: 4,
    category2: 3,
    category3: 5,
    category4: 4,
    overallScore: 4,
    location: "Preston",
    deviceId: "seed-device-e",
    createdAt: "2026-02-22T21:10:00.000Z",
  },
];

const seedDb: Db = { users: seedUsers, ratings: seedRatings };

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function hasWindow() {
  return typeof window !== "undefined";
}

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function readDb(): Db {
  if (!hasWindow()) {
    return clone(seedDb);
  }

  const raw = window.localStorage.getItem(DB_KEY);
  if (!raw) {
    const initial = clone(seedDb);
    window.localStorage.setItem(DB_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed = JSON.parse(raw) as Db;
    if (!Array.isArray(parsed.users) || !Array.isArray(parsed.ratings)) {
      throw new Error("Invalid DB shape");
    }
    return parsed;
  } catch {
    const reset = clone(seedDb);
    window.localStorage.setItem(DB_KEY, JSON.stringify(reset));
    return reset;
  }
}

export function initialDb(): Db {
  return clone(seedDb);
}

export function writeDb(db: Db) {
  if (!hasWindow()) return;
  window.localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function resetDb() {
  if (!hasWindow()) return;
  window.localStorage.setItem(DB_KEY, JSON.stringify(clone(seedDb)));
  window.localStorage.removeItem(SESSION_KEY);
}

export function getDeviceId() {
  if (!hasWindow()) return "server-device";
  const existing = window.localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const created = `device-${uuid()}`;
  window.localStorage.setItem(DEVICE_KEY, created);
  return created;
}

export function getSessionUserId() {
  if (!hasWindow()) return null;
  return window.localStorage.getItem(SESSION_KEY);
}

export function setSessionUserId(userId: string | null) {
  if (!hasWindow()) return;
  if (!userId) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, userId);
}

export function getCurrentUser(db = readDb()): User | null {
  const sessionId = getSessionUserId();
  if (!sessionId) return null;
  return db.users.find((u) => u.id === sessionId) ?? null;
}

export function authenticate(email: string, password: string): User | null {
  const db = readDb();
  const user = db.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password,
  );
  if (!user) return null;
  setSessionUserId(user.id);
  return user;
}

export function logout() {
  setSessionUserId(null);
}

export function getTargetUsers(db: Db, targetType: TargetType) {
  return db.users.filter((u) => u.role === targetType);
}

function isTargetUser(user: User): user is User & { role: TargetType } {
  return user.role === "venue" || user.role === "artist";
}

export function getLocations(db = readDb()) {
  return [...new Set(db.users.filter((u) => u.role !== "admin").map((u) => u.location))].sort();
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function ratingMean(values: number[]) {
  if (!values.length) return 0;
  return round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

export function leaderboard(
  db: Db,
  targetType: TargetType,
  location: string | "All",
  minRatings = 1,
): LeaderboardEntry[] {
  return getTargetUsers(db, targetType)
    .filter((user) => location === "All" || user.location === location)
    .map((user) => {
      const ratings = db.ratings.filter((r) => r.targetId === user.id && r.targetType === targetType);
      return {
        user,
        averageScore: toHundredPointScore(ratingMean(ratings.map((r) => r.overallScore))),
        ratingCount: ratings.length,
      };
    })
    .filter((entry) => entry.ratingCount >= minRatings)
    .sort((a, b) => {
      if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
      if (b.ratingCount !== a.ratingCount) return b.ratingCount - a.ratingCount;
      return a.user.name.localeCompare(b.user.name);
    });
}

export function allLeaderboardRows(db: Db) {
  return [
    ...leaderboard(db, "venue", "All", 0).map((row) => ({ ...row, targetType: "venue" as const })),
    ...leaderboard(db, "artist", "All", 0).map((row) => ({ ...row, targetType: "artist" as const })),
  ].sort((a, b) => +new Date(b.user.createdAt) - +new Date(a.user.createdAt));
}

export function findTarget(db: Db, id: string): (User & { role: TargetType }) | null {
  const user = db.users.find(
    (u): u is User & { role: TargetType } => u.id === id && isTargetUser(u),
  );
  if (!user) return null;
  return user;
}

export function submitRating(input: {
  targetId: string;
  category1: number;
  category2: number;
  category3: number;
  category4?: number;
}): { ok: true; rating: Rating } | { ok: false; error: string } {
  const db = readDb();
  const target = findTarget(db, input.targetId);
  if (!target) return { ok: false, error: "Target not found." };

  const values = [input.category1, input.category2, input.category3];
  if (typeof input.category4 === "number") values.push(input.category4);

  const valid = values.every(
    (v) => Number.isFinite(v) && v >= SCORE_SCALE.min && v <= SCORE_SCALE.max,
  );
  if (!valid) {
    return { ok: false, error: `Scores must be between ${SCORE_SCALE.min} and ${SCORE_SCALE.max}.` };
  }

  const deviceId = getDeviceId();
  const now = Date.now();
  const recentDuplicate = db.ratings.find(
    (r) => r.targetId === input.targetId && r.deviceId === deviceId && now - +new Date(r.createdAt) < DUPLICATE_WINDOW_MS,
  );
  if (recentDuplicate) {
    return { ok: false, error: "Please wait a minute before rating this act/venue again." };
  }

  const overallScore = toHundredPointScore(ratingMean(values));
  const rating: Rating = {
    id: `rating-${uuid()}`,
    targetId: target.id,
    targetType: target.role,
    category1: input.category1,
    category2: input.category2,
    category3: input.category3,
    category4: input.category4,
    overallScore,
    location: target.location,
    deviceId,
    createdAt: new Date().toISOString(),
  };

  db.ratings.unshift(rating);
  writeDb(db);
  return { ok: true, rating };
}

export function getUserStats(db: Db, userId: string): UserStats {
  const user = db.users.find((u) => u.id === userId);
  if (!user || (user.role !== "venue" && user.role !== "artist")) {
    return {
      totalRatings: 0,
      averageScore: 0,
      category1Average: 0,
      category2Average: 0,
      category3Average: 0,
      category4Average: null,
    };
  }

  const ratings = db.ratings.filter((r) => r.targetId === userId);
  const c4Values = ratings
    .map((r) => r.category4)
    .filter((v): v is number => typeof v === "number");

  return {
    totalRatings: ratings.length,
    averageScore: toHundredPointScore(ratingMean(ratings.map((r) => r.overallScore))),
    category1Average: ratingMean(ratings.map((r) => r.category1)),
    category2Average: ratingMean(ratings.map((r) => r.category2)),
    category3Average: ratingMean(ratings.map((r) => r.category3)),
    category4Average: c4Values.length ? ratingMean(c4Values) : null,
  };
}

export function createManagedUser(input: {
  name: string;
  email: string;
  role: TargetType;
  location: string;
  password?: string;
}): { ok: true; user: User } | { ok: false; error: string } {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const location = input.location.trim();

  if (!name || !email || !location) {
    return { ok: false, error: "Name, email and town are required." };
  }

  const db = readDb();
  if (db.users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, error: "Email already exists." };
  }

  const user: User = {
    id: `${input.role}-${uuid()}`,
    name,
    email,
    password: input.password?.trim() || "demo123",
    role: input.role,
    location,
    createdAt: new Date().toISOString(),
  };

  db.users.push(user);
  writeDb(db);
  return { ok: true, user };
}

export function clearRatings() {
  const db = readDb();
  db.ratings = [];
  writeDb(db);
}

export function formatRole(role: Role) {
  if (role === "admin") return "Admin";
  return role === "venue" ? "Venue" : "Artist/Band";
}

export function recentRatings(db: Db, limit = 20) {
  return [...db.ratings]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, limit)
    .map((rating) => ({
      rating,
      target: db.users.find((u) => u.id === rating.targetId) ?? null,
    }));
}
