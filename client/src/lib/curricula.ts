export const curricula = [
  { value: "UAE Ministry", en: "UAE Ministry", ar: "منهج وزارة التربية الإماراتية" },
  { value: "Egyptian Ministry", en: "Egyptian Ministry", ar: "منهج وزارة التربية والتعليم المصرية" },
  { value: "Saudi Ministry", en: "Saudi Ministry", ar: "منهج وزارة التعليم السعودية" },
  { value: "British (IGCSE/GCSE/A-Level)", en: "British (IGCSE/GCSE/A-Level)", ar: "البريطاني (IGCSE/GCSE/A-Level)" },
  { value: "American", en: "American", ar: "الأمريكي" },
  { value: "IB", en: "IB", ar: "البكالوريا الدولية (IB)" },
  { value: "CBSE", en: "CBSE", ar: "الهندي (CBSE)" },
  { value: "Other", en: "Other", ar: "أخرى" },
] as const;

export function curriculumLabel(value: string, lang: "ar" | "en") {
  return curricula.find(item => item.value === value)?.[lang] ?? value;
}
