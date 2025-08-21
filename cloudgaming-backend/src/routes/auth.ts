import { Router } from "express";
import { z } from "zod";
import { createUser, findUserByEmail } from "../db";
import { hashPassword, signJWT, verifyPassword, authMiddleware, AuthedRequest } from "../auth";


const router = Router();

const emailSchema = z.string().email().max(254);
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "Include letters and numbers");

const registerSchema = z.object({ email: emailSchema, password: passwordSchema });
const loginSchema = z.object({ email: emailSchema, password: z.string().min(1) });

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password } = parsed.data;

  const existing = await findUserByEmail(email.toLowerCase());
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const password_hash = await hashPassword(password);
  const user = await createUser(email, password_hash);
  const token = signJWT({ sub: user.id, email: user.email });
  res.status(201).json({ ...user, token });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password } = parsed.data;

  const user = await findUserByEmail(email.toLowerCase());
  if (!user) return res.status(401).json({ error: "Invalid email or password" });
  if (user.status !== "active") return res.status(403).json({ error: "Account is not active" });

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });

  const token = signJWT({ sub: user.id, email: user.email });
  const { password_hash, ...safe } = user;
  res.json({ ...safe, token });
});

router.get("/me", authMiddleware, async (req: AuthedRequest, res) => {
  // In MVP we re-use the JWT payload; if you need fresh data, query DB by req.user!.sub
  res.json({ id: req.user!.sub, email: req.user!.email });
});

export default router;