import { afterEach, describe, expect, it, vi } from "vitest";
import { publicPlatformConfig, publicPlatformScript } from "./_core/publicConfig";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { listLLMModels } from "./_core/llm";

const fakeRequest = (secure = false) => ({
  secure,
  get: (name: string) => name.toLowerCase() === "x-forwarded-proto" && secure ? "https" : undefined,
}) as never;

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("self-hosted platform configuration", () => {
  it("exposes only the referrer-restricted Google Maps browser key", () => {
    const env = { GOOGLE_MAPS_BROWSER_KEY: "public-browser-test", AI_API_KEY: "server-only-test", SESSION_SECRET: "signing-only-test", DATABASE_URL: "db-only-test" };
    expect(publicPlatformConfig(env)).toMatchObject({ apiUrl: "https://maps.googleapis.com", apiBrowserKey: "public-browser-test", projectId: "", oauthPortalUrl: "" });
    const script = publicPlatformScript(env);
    for (const value of [env.AI_API_KEY, env.SESSION_SECRET, env.DATABASE_URL]) expect(script).not.toContain(value);
    expect(script).toContain("__MIHWAR_CONFIG__");
  });
  it("does not guess an AI provider when its configuration is absent", async () => {
    vi.stubEnv("AI_API_BASE_URL", ""); vi.stubEnv("AI_API_KEY", "");
    const request = vi.fn(); vi.stubGlobal("fetch", request);
    await expect(listLLMModels()).rejects.toThrow("AI_API_KEY");
    expect(request).not.toHaveBeenCalled();
  });
  it("uses a same-site cookie and enables Secure only behind HTTPS", () => {
    expect(getSessionCookieOptions(fakeRequest(false))).toMatchObject({ secure: false, httpOnly: true, sameSite: "lax" });
    expect(getSessionCookieOptions(fakeRequest(true))).toMatchObject({ secure: true, httpOnly: true, sameSite: "lax" });
  });
  it("binds signed sessions to the self-hosted application id", async () => {
    vi.stubEnv("MIHWAR_APP_ID", "mihwar-test");
    vi.stubEnv("SESSION_SECRET", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    const token = await sdk.signSession({ openId: "user-test", appId: "mihwar-test", name: "" });
    expect(await sdk.verifySession(token)).toMatchObject({ openId: "user-test" });
    vi.stubEnv("MIHWAR_APP_ID", "different-project");
    expect(await sdk.verifySession(token)).toBeNull();
  });
});
