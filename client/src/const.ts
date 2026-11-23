export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Navigate to Mihwar's self-hosted sign-in page. */
export const startLogin = () => {
  if (typeof window === "undefined") return;
  const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const safeNext = next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/";
  window.location.assign(`/login?next=${encodeURIComponent(safeNext)}`);
};
