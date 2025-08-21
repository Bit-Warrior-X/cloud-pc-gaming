import { Router as GamesRouter } from "express";
import { listGames } from "../db";

const games = GamesRouter();

games.get("/", async (_req, res) => {
  try {
    const rows = await listGames();
    res.json(rows);
  } catch (e) {
    console.error("GET /games error", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { games as gamesRoutes };