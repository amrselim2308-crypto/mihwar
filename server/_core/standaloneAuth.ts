import { randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { authCredentials, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function deriveKey(password: string, salt: string, length: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, length, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey as Buffer);
    });
  });
}
const attempts = new Map<string, { count: number; resetAt: number }>();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function rejectCrossOrigin(req: Request, res: Response): boolean {
  const origin = req.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host !== req.get("host");
  } catch {
    res.status(403).json({ error: "طلب غير مسموح." });
    return true;
  }
}

function isRateLimited(req: Request): boolean {
  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  // Bound memory use under distributed abuse; opportunistically discard expired buckets.
  if (attempts.size > 10_000) {
    for (const [entryKey, entry] of attempts) {
      if (entry.resetAt <= now) attempts.delete(entryKey);
      if (attempts.size <= 8_000) break;
    }
    // If every bucket is still active, evict oldest buckets rather than locking
    // authentication for the entire process until their windows expire.
    while (attempts.size > 8_000) {
      const oldestKey = attempts.keys().next().value;
      if (!oldestKey) break;
      attempts.delete(oldestKey);
    }
  }
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + 10 * 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 12;
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomUUID().replace(/-/g, "");
  const derived = await deriveKey(password, salt, 64);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, salt, hash] = encoded.split("$");
  if (algorithm !== "scrypt" || !salt || !hash || !/^[a-f0-9]{128}$/i.test(hash)) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = await deriveKey(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function setSession(res: Response, req: Request, token: string) {
  res.cookie(COOKIE_NAME, token, {
    ...getSessionCookieOptions(req),
    maxAge: ONE_YEAR_MS,
  });
}

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function validBootstrapToken(candidate: unknown): boolean {
  const configured = process.env.BOOTSTRAP_ADMIN_TOKEN ?? "";
  if (typeof candidate !== "string" || configured.length < 32 || candidate.length !== configured.length) return false;
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(configured));
}

export function registerStandaloneAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req, res) => {
    if (rejectCrossOrigin(req, res)) return;
    if (isRateLimited(req)) { res.status(429).json({ error: "محاولات كثيرة. حاول لاحقاً." }); return; }
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (name.length < 2 || name.length > 160 || !EMAIL_RE.test(email) || email.length > 320 || password.length < 10 || password.length > 200) {
      res.status(400).json({ error: "أدخل اسماً صحيحاً وبريداً صالحاً وكلمة مرور لا تقل عن 10 أحرف." });
      return;
    }

    const database = await getDb();
    if (!database) { res.status(503).json({ error: "قاعدة البيانات غير متاحة حالياً." }); return; }
    try {
      const existing = await database.select({ id: authCredentials.id }).from(authCredentials).where(eq(authCredentials.email, email)).limit(1);
      const existingUser = await database.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (existing.length || existingUser.length) { res.status(409).json({ error: "هذا البريد مسجل بالفعل." }); return; }

      const openId = `mihwar_${randomUUID().replace(/-/g, "")}`;
      const bootstrapEmail = normalizeEmail(process.env.BOOTSTRAP_ADMIN_EMAIL);
      const role = bootstrapEmail && bootstrapEmail === email && validBootstrapToken(req.body?.adminSetupToken)
        ? "admin" as const
        : "user" as const;
      const createdUser = await database.transaction(async tx => {
        await tx.insert(users).values({ openId, name, email, loginMethod: "email", role, lastSignedIn: new Date() });
        const [record] = await tx.select().from(users).where(eq(users.openId, openId)).limit(1);
        if (!record) throw new Error("User record was not created");
        await tx.insert(authCredentials).values({ userId: record.id, email, passwordHash: await hashPassword(password) });
        return record;
      });
      const token = await sdk.createSessionToken(openId, { name, expiresInMs: ONE_YEAR_MS });
      setSession(res, req, token);
      res.status(201).json({ success: true, user: { id: createdUser.id, name, email, role } });
      return;
    } catch (error) {
      console.error("[Auth] Registration failed:", error instanceof Error ? error.message : "unknown error");
      res.status(500).json({ error: "تعذر إنشاء الحساب. حاول مرة أخرى." });
      return;
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    if (rejectCrossOrigin(req, res)) return;
    if (isRateLimited(req)) { res.status(429).json({ error: "محاولات كثيرة. حاول بعد عشر دقائق." }); return; }
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!EMAIL_RE.test(email) || !password) { res.status(400).json({ error: "تحقق من البريد الإلكتروني وكلمة المرور." }); return; }
    const database = await getDb();
    if (!database) { res.status(503).json({ error: "قاعدة البيانات غير متاحة حالياً." }); return; }
    try {
      const rows = await database.select({ user: users, credential: authCredentials })
        .from(authCredentials)
        .innerJoin(users, eq(authCredentials.userId, users.id))
        .where(eq(authCredentials.email, email)).limit(1);
      const row = rows[0];
      if (!row || !(await verifyPassword(password, row.credential.passwordHash))) {
        res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." });
        return;
      }
      await database.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, row.user.id));
      const token = await sdk.createSessionToken(row.user.openId, { name: row.user.name || "", expiresInMs: ONE_YEAR_MS });
      setSession(res, req, token);
      res.json({ success: true, user: { id: row.user.id, name: row.user.name, email: row.user.email, role: row.user.role } });
      return;
    } catch (error) {
      console.error("[Auth] Login failed:", error instanceof Error ? error.message : "unknown error");
      res.status(500).json({ error: "تعذر تسجيل الدخول حالياً." });
      return;
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    const forwardedProto = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
    res.clearCookie(COOKIE_NAME, { path: "/", sameSite: "lax", secure: req.secure || forwardedProto === "https" });
    res.json({ success: true });
  });
}
