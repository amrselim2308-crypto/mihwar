import type { Express, Request, Response } from "express";
import { storageGetSignedUrl } from "../storage";

export function registerStorageProxy(app: Express) {
  const handler = async (req: Request, res: Response) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) { res.status(400).send("Missing storage key"); return; }
    try {
      const url = await storageGetSignedUrl(key);
      res.set("Cache-Control", "private, no-store");
      res.redirect(307, url);
    } catch (error) {
      console.error("[StorageProxy] failed:", error instanceof Error ? error.message : "unknown error");
      res.status(502).send("Storage backend unavailable");
    }
  };
  app.get("/storage/*", handler);
  // Backward compatibility for asset URLs already stored in existing records.
  app.get("/manus-storage/*", handler);
}
