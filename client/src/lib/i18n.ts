export type Language = "ar" | "en";

export function t(language: Language, english: string, arabic: string): string {
  return language === "ar" ? arabic : english;
}

export function readList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    // Keep compatibility with comma-separated drafts.
  }
  return value.split(",").map(item => item.trim()).filter(Boolean);
}
