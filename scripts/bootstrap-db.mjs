import process from 'node:process';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Pool } = pg;
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined,
});

const hash = (v) => bcrypt.hashSync(v, 10);

const seedUsers = [
  ['artist-1', 'Neon Harbor', 'artist1@enlive.local', hash('demo123'), 'artist', 'Chorley', '2026-02-20T18:00:00.000Z'],
  ['artist-2', 'Juno Vale', 'artist2@enlive.local', hash('demo123'), 'artist', 'London', '2026-02-20T18:00:00.000Z'],
  ['artist-3', 'The Midnight Echo', 'artist3@enlive.local', hash('demo123'), 'artist', 'Wigan', '2026-02-20T18:00:00.000Z'],
  ['artist-4', 'Solar Flare', 'artist4@enlive.local', hash('demo123'), 'artist', 'Chorley', '2026-02-20T18:00:00.000Z'],
  ['artist-5', 'Velvet Underground', 'artist5@enlive.local', hash('demo123'), 'artist', 'Manchester', '2026-02-20T18:00:00.000Z'],
  ['artist-6', 'Luna Blue', 'artist6@enlive.local', hash('demo123'), 'artist', 'Leeds', '2026-02-20T18:00:00.000Z'],
  ['artist-7', 'Starlight Symphony', 'artist7@enlive.local', hash('demo123'), 'artist', 'Newcastle', '2026-02-20T18:00:00.000Z'],
  ['artist-8', 'Oceania', 'artist8@enlive.local', hash('demo123'), 'artist', 'Bristol', '2026-02-20T18:00:00.000Z'],
  ['artist-9', 'Echo Canyon', 'artist9@enlive.local', hash('demo123'), 'artist', 'Birmingham', '2026-02-20T18:00:00.000Z'],
  ['artist-10', 'Wildwood', 'artist10@enlive.local', hash('demo123'), 'artist', 'Bolton', '2026-02-20T18:00:00.000Z'],
  ['artist-11', 'Silver Lining', 'artist11@enlive.local', hash('demo123'), 'artist', 'Preston', '2026-02-20T18:00:00.000Z'],
  ['artist-12', 'The Groove Collective', 'artist12@enlive.local', hash('demo123'), 'artist', 'Blackburn', '2026-02-20T18:00:00.000Z'],
  ['artist-13', 'Pulse', 'artist13@enlive.local', hash('demo123'), 'artist', 'Leeds', '2026-02-20T18:00:00.000Z'],
  ['artist-14', 'Rhythm & Blues', 'artist14@enlive.local', hash('demo123'), 'artist', 'Bolton', '2026-02-20T18:00:00.000Z'],
  ['artist-15', 'The Wanderers', 'artist15@enlive.local', hash('demo123'), 'artist', 'Liverpool', '2026-02-20T18:00:00.000Z'],
  ['venue-1', 'The Crown Social', 'venue1@enlive.local', hash('demo123'), 'venue', 'Liverpool', '2026-02-20T18:00:00.000Z'],
  ['venue-2', 'River Room', 'venue2@enlive.local', hash('demo123'), 'venue', 'Chorley', '2026-02-20T18:00:00.000Z'],
  ['venue-3', 'The Grand Stage', 'venue3@enlive.local', hash('demo123'), 'venue', 'Bolton', '2026-02-20T18:00:00.000Z'],
  ['venue-4', 'Blue Note', 'venue4@enlive.local', hash('demo123'), 'venue', 'Bolton', '2026-02-20T18:00:00.000Z'],
  ['venue-5', 'Acoustic Attic', 'venue5@enlive.local', hash('demo123'), 'venue', 'Wigan', '2026-02-20T18:00:00.000Z'],
  ['venue-6', 'The Sound House', 'venue6@enlive.local', hash('demo123'), 'venue', 'Glasgow', '2026-02-20T18:00:00.000Z'],
  ['venue-7', 'Vibe Central', 'venue7@enlive.local', hash('demo123'), 'venue', 'Birmingham', '2026-02-20T18:00:00.000Z'],
  ['venue-8', 'Melody Mansion', 'venue8@enlive.local', hash('demo123'), 'venue', 'Newcastle', '2026-02-20T18:00:00.000Z'],
  ['venue-9', 'The Basement', 'venue9@enlive.local', hash('demo123'), 'venue', 'Manchester', '2026-02-20T18:00:00.000Z'],
  ['venue-10', 'Sky Lounge', 'venue10@enlive.local', hash('demo123'), 'venue', 'Newcastle', '2026-02-20T18:00:00.000Z'],
  ['venue-11', 'Harbor Lights', 'venue11@enlive.local', hash('demo123'), 'venue', 'Blackburn', '2026-02-20T18:00:00.000Z'],
  ['venue-12', 'The Junction', 'venue12@enlive.local', hash('demo123'), 'venue', 'Birmingham', '2026-02-20T18:00:00.000Z'],
  ['venue-13', 'Electric Alley', 'venue13@enlive.local', hash('demo123'), 'venue', 'Wigan', '2026-02-20T18:00:00.000Z'],
  ['venue-14', 'Harmony Hall', 'venue14@enlive.local', hash('demo123'), 'venue', 'Chorley', '2026-02-20T18:00:00.000Z'],
  ['venue-15', 'The Workshop', 'venue15@enlive.local', hash('demo123'), 'venue', 'Glasgow', '2026-02-20T18:00:00.000Z'],
  ['city-1', 'Chorley', 'city1@enlive.local', hash('demo123'), 'city', 'Chorley', '2026-02-20T18:00:00.000Z'],
  ['city-2', 'Preston', 'city2@enlive.local', hash('demo123'), 'city', 'Preston', '2026-02-20T18:00:00.000Z'],
  ['city-3', 'Leyland', 'city3@enlive.local', hash('demo123'), 'city', 'Leyland', '2026-02-20T18:00:00.000Z'],
  ['city-4', 'Blackburn', 'city4@enlive.local', hash('demo123'), 'city', 'Blackburn', '2026-02-20T18:00:00.000Z'],
  ['city-5', 'Bolton', 'city5@enlive.local', hash('demo123'), 'city', 'Bolton', '2026-02-20T18:00:00.000Z'],
  ['city-6', 'Wigan', 'city6@enlive.local', hash('demo123'), 'city', 'Wigan', '2026-02-20T18:00:00.000Z'],
  ['city-7', 'Manchester', 'city7@enlive.local', hash('demo123'), 'city', 'Manchester', '2026-02-20T18:00:00.000Z'],
  ['city-8', 'Liverpool', 'city8@enlive.local', hash('demo123'), 'city', 'Liverpool', '2026-02-20T18:00:00.000Z'],
  ['city-9', 'Leeds', 'city9@enlive.local', hash('demo123'), 'city', 'Leeds', '2026-02-20T18:00:00.000Z'],
  ['city-10', 'Sheffield', 'city10@enlive.local', hash('demo123'), 'city', 'Sheffield', '2026-02-20T18:00:00.000Z'],
  ['city-11', 'Newcastle', 'city11@enlive.local', hash('demo123'), 'city', 'Newcastle', '2026-02-20T18:00:00.000Z'],
  ['city-12', 'London', 'city12@enlive.local', hash('demo123'), 'city', 'London', '2026-02-20T18:00:00.000Z'],
  ['city-13', 'Birmingham', 'city13@enlive.local', hash('demo123'), 'city', 'Birmingham', '2026-02-20T18:00:00.000Z'],
  ['city-14', 'Bristol', 'city14@enlive.local', hash('demo123'), 'city', 'Bristol', '2026-02-20T18:00:00.000Z'],
  ['city-15', 'Glasgow', 'city15@enlive.local', hash('demo123'), 'city', 'Glasgow', '2026-02-20T18:00:00.000Z'],
  ['admin-enlive', 'Enlive Admin', 'admin@enlive.local', hash('secret123'), 'admin', 'Chorley', '2026-02-20T18:00:00.000Z'],
];

const seedRatings = [
  ['r-a-1', 'artist-1', 'artist', 5, 4, 4, 5, 90.0, 'Chorley', 'seed', '2026-03-01T12:00:00Z'],
  ['r-a-2', 'artist-2', 'artist', 4, 5, 3, 4, 80.0, 'London', 'seed', '2026-03-01T12:00:00Z'],
  ['r-a-3', 'artist-3', 'artist', 5, 5, 5, 5, 100.0, 'Wigan', 'seed', '2026-03-01T12:00:00Z'],
  ['r-a-4', 'artist-4', 'artist', 4, 4, 3, 3, 70.0, 'Chorley', 'seed', '2026-03-01T12:00:00Z'],
  ['r-a-5', 'artist-5', 'artist', 3, 4, 4, 3, 70.0, 'Manchester', 'seed', '2026-03-01T12:00:00Z'],
  ['r-a-6', 'artist-6', 'artist', 5, 5, 4, 4, 90.0, 'Leeds', 'seed', '2026-03-01T12:00:00Z'],
  ['r-a-7', 'artist-7', 'artist', 4, 5, 5, 4, 90.0, 'Newcastle', 'seed', '2026-03-01T12:00:00Z'],
  ['r-a-8', 'artist-8', 'artist', 5, 4, 3, 5, 85.0, 'Bristol', 'seed', '2026-03-01T12:00:00Z'],
  ['r-a-9', 'artist-9', 'artist', 3, 3, 3, 4, 65.0, 'Birmingham', 'seed', '2026-03-01T12:00:00Z'],
  ['r-a-10', 'artist-10', 'artist', 4, 5, 4, 5, 90.0, 'Bolton', 'seed', '2026-03-01T12:00:00Z'],
  ['r-a-11', 'artist-11', 'artist', 5, 5, 3, 4, 85.0, 'Preston', 'seed', '2026-03-01T12:00:00Z'],
  ['r-a-12', 'artist-12', 'artist', 4, 4, 3, 3, 70.0, 'Blackburn', 'seed', '2026-03-01T12:00:00Z'],
  ['r-a-13', 'artist-13', 'artist', 5, 5, 5, 5, 100.0, 'Leeds', 'seed', '2026-03-01T12:00:00Z'],
  ['r-a-14', 'artist-14', 'artist', 3, 3, 4, 3, 65.0, 'Bolton', 'seed', '2026-03-01T12:00:00Z'],
  ['r-a-15', 'artist-15', 'artist', 4, 5, 3, 4, 80.0, 'Liverpool', 'seed', '2026-03-01T12:00:00Z'],
  ['r-v-1', 'venue-1', 'venue', 5, 4, 5, 5, 95.0, 'Liverpool', 'seed', '2026-03-01T12:00:00Z'],
  ['r-v-2', 'venue-2', 'venue', 4, 3, 4, 4, 75.0, 'Chorley', 'seed', '2026-03-01T12:00:00Z'],
  ['r-v-3', 'venue-3', 'venue', 5, 5, 3, 4, 85.0, 'Bolton', 'seed', '2026-03-01T12:00:00Z'],
  ['r-v-4', 'venue-4', 'venue', 3, 4, 4, 3, 70.0, 'Bolton', 'seed', '2026-03-01T12:00:00Z'],
  ['r-v-5', 'venue-5', 'venue', 5, 4, 4, 5, 90.0, 'Wigan', 'seed', '2026-03-01T12:00:00Z'],
  ['r-v-6', 'venue-6', 'venue', 4, 5, 3, 4, 80.0, 'Glasgow', 'seed', '2026-03-01T12:00:00Z'],
  ['r-v-7', 'venue-7', 'venue', 5, 5, 5, 5, 100.0, 'Birmingham', 'seed', '2026-03-01T12:00:00Z'],
  ['r-v-8', 'venue-8', 'venue', 3, 3, 4, 3, 65.0, 'Newcastle', 'seed', '2026-03-01T12:00:00Z'],
  ['r-v-9', 'venue-9', 'venue', 4, 4, 3, 3, 70.0, 'Manchester', 'seed', '2026-03-01T12:00:00Z'],
  ['r-v-10', 'venue-10', 'venue', 5, 5, 4, 4, 90.0, 'Newcastle', 'seed', '2026-03-01T12:00:00Z'],
  ['r-v-11', 'venue-11', 'venue', 4, 5, 5, 4, 90.0, 'Blackburn', 'seed', '2026-03-01T12:00:00Z'],
  ['r-v-12', 'venue-12', 'venue', 5, 4, 3, 5, 85.0, 'Birmingham', 'seed', '2026-03-01T12:00:00Z'],
  ['r-v-13', 'venue-13', 'venue', 3, 3, 5, 4, 75.0, 'Wigan', 'seed', '2026-03-01T12:00:00Z'],
  ['r-v-14', 'venue-14', 'venue', 4, 5, 4, 5, 90.0, 'Chorley', 'seed', '2026-03-01T12:00:00Z'],
  ['r-v-15', 'venue-15', 'venue', 5, 5, 5, 5, 100.0, 'Glasgow', 'seed', '2026-03-01T12:00:00Z'],
  ['r-c-1', 'city-1', 'city', 5, 4, 4, 5, 90.0, 'Chorley', 'seed', '2026-03-01T12:00:00Z'],
  ['r-c-2', 'city-2', 'city', 4, 5, 3, 4, 80.0, 'Preston', 'seed', '2026-03-01T12:00:00Z'],
  ['r-c-3', 'city-3', 'city', 5, 5, 5, 5, 100.0, 'Leyland', 'seed', '2026-03-01T12:00:00Z'],
  ['r-c-4', 'city-4', 'city', 4, 4, 3, 3, 70.0, 'Blackburn', 'seed', '2026-03-01T12:00:00Z'],
  ['r-c-5', 'city-5', 'city', 3, 4, 4, 3, 70.0, 'Bolton', 'seed', '2026-03-01T12:00:00Z'],
  ['r-c-6', 'city-6', 'city', 5, 5, 4, 4, 90.0, 'Wigan', 'seed', '2026-03-01T12:00:00Z'],
  ['r-c-7', 'city-7', 'city', 4, 5, 5, 4, 90.0, 'Manchester', 'seed', '2026-03-01T12:00:00Z'],
  ['r-c-8', 'city-8', 'city', 5, 4, 3, 5, 85.0, 'Liverpool', 'seed', '2026-03-01T12:00:00Z'],
  ['r-c-9', 'city-9', 'city', 3, 3, 3, 4, 65.0, 'Leeds', 'seed', '2026-03-01T12:00:00Z'],
  ['r-c-10', 'city-10', 'city', 4, 5, 4, 5, 90.0, 'Sheffield', 'seed', '2026-03-01T12:00:00Z'],
  ['r-c-11', 'city-11', 'city', 5, 5, 3, 4, 85.0, 'Newcastle', 'seed', '2026-03-01T12:00:00Z'],
  ['r-c-12', 'city-12', 'city', 4, 4, 3, 3, 70.0, 'London', 'seed', '2026-03-01T12:00:00Z'],
  ['r-c-13', 'city-13', 'city', 5, 5, 5, 5, 100.0, 'Birmingham', 'seed', '2026-03-01T12:00:00Z'],
  ['r-c-14', 'city-14', 'city', 3, 3, 4, 3, 65.0, 'Bristol', 'seed', '2026-03-01T12:00:00Z'],
  ['r-c-15', 'city-15', 'city', 4, 5, 3, 4, 80.0, 'Glasgow', 'seed', '2026-03-01T12:00:00Z'],
];

const client = await pool.connect();
try {
  await client.query('BEGIN');
  const countRes = await client.query('SELECT COUNT(*)::int AS count FROM users');
  const userCount = countRes.rows[0]?.count ?? 0;

  if (userCount === 0) {
    for (const row of seedUsers) {
      await client.query(
        'INSERT INTO users (id, name, email, password_hash, role, location, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        row,
      );
    }
    for (const row of seedRatings) {
      await client.query(
        'INSERT INTO ratings (id,target_id,target_type,category_1_score,category_2_score,category_3_score,category_4_score,overall_score,location,device_id,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
        row,
      );
    }
    console.log('Seed data inserted.');
  } else {
    console.log(`Seed skipped (users=${userCount}).`);
  }

  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  console.error(err);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
