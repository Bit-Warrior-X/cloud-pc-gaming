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
  `);
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