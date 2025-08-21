import { Pool } from "pg";

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function migrate() {
  // Minimal schema for users; extend with wallets later
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    -- Games catalog (MVP)
    CREATE TABLE IF NOT EXISTS games (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      platform TEXT,
      app_id TEXT,
      status TEXT NOT NULL CHECK (status IN ('READY','PREPARE')) DEFAULT 'PREPARE',
      last_update_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  // Seed a few sample games if table is empty (MVP convenience)
  const { rows } = await pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM games`);
  if (!rows[0] || rows[0].count === "0") {
    await pool.query(
      `INSERT INTO games (slug, title, platform, app_id, status) VALUES
        ('apex-legends', 'Apex Legends', 'EA', '1172470', 'READY'),
        ('fortnite', 'Fortnite', 'Epic', 'fortnite', 'PREPARE'),
        ('cs2', 'Counter-Strike 2', 'Steam', '730', 'READY')
      ON CONFLICT (slug) DO NOTHING;`
    );
  }
}

export type DbUser = {
  id: string;
  email: string;
  password_hash: string;
  status: string;
  created_at: string;
};

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const { rows } = await pool.query<DbUser>(
    "SELECT id, email, password_hash, status, created_at FROM users WHERE email = $1",
    [email]
  );
  return rows[0] ?? null;
}

export async function createUser(email: string, password_hash: string): Promise<Omit<DbUser, "password_hash">> {
  const { rows } = await pool.query<Omit<DbUser, "password_hash">>(
    `INSERT INTO users (email, password_hash, status)
     VALUES ($1, $2, 'active')
     RETURNING id, email, status, created_at`,
    [email.toLowerCase(), password_hash]
  );
  return rows[0];
}

export type DbGame = {
  id: string;
  slug: string;
  title: string;
  platform: string | null;
  app_id: string | null;
  status: 'READY' | 'PREPARE';
  last_update_at: string;
};

export async function listGames(): Promise<Pick<DbGame, 'id' | 'slug' | 'title' | 'status'>[]> {
  const { rows } = await pool.query<Pick<DbGame,'id'|'slug'|'title'|'status'>>(
    `SELECT id, slug, title, status FROM games ORDER BY title ASC`
  );
  return rows;
}
