import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import { gamesRoutes } from "./routes/games";
import { migrate, pool } from "./db";

const app = express();

const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
app.use(cors({ origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use("/auth", authRoutes);
app.use("/games", gamesRoutes);

const PORT = Number(process.env.PORT || 3001);

(async () => {
  try {
    await migrate();
    app.listen(PORT, () => console.log(`Auth API listening on :${PORT}`));
  } catch (e) {
    console.error("Startup error", e);
    await pool.end();
    process.exit(1);
  }
})();