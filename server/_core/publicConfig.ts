// Only the referrer-restricted Google Maps browser key is exposed to the client.
export function publicPlatformConfig(env: NodeJS.ProcessEnv = process.env) {
  return {
    projectId: "",
    oauthPortalUrl: "",
    apiUrl: "https://maps.googleapis.com",
    apiBrowserKey: env.GOOGLE_MAPS_BROWSER_KEY ?? "",
  };
}

export function publicPlatformScript(env: NodeJS.ProcessEnv = process.env): string {
  const json = JSON.stringify(publicPlatformConfig(env)).replaceAll("<", "\\u003c");
  return `window.__MIHWAR_CONFIG__=${json};`;
}
