export const LIBRARY_COUNTRIES = ["EG", "AE", "SA"] as const;
export type LibraryCountry = (typeof LIBRARY_COUNTRIES)[number];

export const LIBRARY_COUNTRY_LABELS: Record<LibraryCountry, { en: string; ar: string }> = {
  EG: { en: "Egypt · Ministry of Education", ar: "مصر · وزارة التربية والتعليم" },
  AE: { en: "UAE · Ministry of Education", ar: "الإمارات · وزارة التربية والتعليم" },
  SA: { en: "Saudi Arabia · Ministry of Education", ar: "السعودية · وزارة التعليم" },
};

export const LIBRARY_CURRICULA = ["EG_MOE", "AE_MOE", "SA_MOE"] as const;
export type LibraryCurriculum = (typeof LIBRARY_CURRICULA)[number];

export const LIBRARY_CURRICULUM_BY_COUNTRY: Record<LibraryCountry, LibraryCurriculum> = {
  EG: "EG_MOE",
  AE: "AE_MOE",
  SA: "SA_MOE",
};

export const LIBRARY_TERMS = [
  { value: "term_1", en: "Term 1", ar: "الفصل الدراسي الأول" },
  { value: "term_2", en: "Term 2", ar: "الفصل الدراسي الثاني" },
  { value: "year", en: "Full year", ar: "العام الدراسي كاملًا" },
] as const;
export type LibraryTerm = (typeof LIBRARY_TERMS)[number]["value"];

export const LIBRARY_CATEGORIES = [
  { value: "official_textbook", en: "Official textbook", ar: "كتاب مدرسي رسمي" },
  { value: "authorized_reference", en: "Authorized reference", ar: "مرجع مرخّص" },
  { value: "study_notes", en: "Study notes & summaries", ar: "مذكرات وملخصات" },
  { value: "past_exams", en: "Past exams", ar: "امتحانات سابقة" },
  { value: "question_bank", en: "Question bank", ar: "بنك أسئلة" },
] as const;
export type LibraryCategory = (typeof LIBRARY_CATEGORIES)[number]["value"];
export const TEACHER_LIBRARY_CATEGORIES = ["authorized_reference", "study_notes", "past_exams", "question_bank"] as const;
export type TeacherLibraryCategory = (typeof TEACHER_LIBRARY_CATEGORIES)[number];

export const LIBRARY_FORMATS = [
  { value: "pdf", en: "PDF", ar: "ملف PDF" },
  { value: "interactive_quiz", en: "Interactive quiz", ar: "اختبار تفاعلي" },
  { value: "video_summary", en: "Video summary", ar: "ملخص فيديو" },
  { value: "external_link", en: "External link", ar: "رابط خارجي" },
] as const;
export type LibraryFormat = (typeof LIBRARY_FORMATS)[number]["value"];

export const LIBRARY_SUBJECTS = [
  { value: "arabic", en: "Arabic", ar: "اللغة العربية" },
  { value: "english", en: "English", ar: "اللغة الإنجليزية" },
  { value: "mathematics", en: "Mathematics", ar: "الرياضيات" },
  { value: "science", en: "General science", ar: "العلوم" },
  { value: "physics", en: "Physics", ar: "الفيزياء" },
  { value: "chemistry", en: "Chemistry", ar: "الكيمياء" },
  { value: "biology", en: "Biology", ar: "الأحياء" },
  { value: "islamic_education", en: "Islamic education", ar: "التربية الإسلامية" },
  { value: "social_studies", en: "Social studies", ar: "الدراسات الاجتماعية" },
  { value: "computer_science", en: "Computer science", ar: "الحاسوب" },
  { value: "history", en: "History", ar: "التاريخ" },
  { value: "geography", en: "Geography", ar: "الجغرافيا" },
  { value: "technology", en: "Technology", ar: "التكنولوجيا" },
  { value: "other", en: "Other subject", ar: "مادة أخرى" },
] as const;
export type LibrarySubject = (typeof LIBRARY_SUBJECTS)[number]["value"];

export type LibraryStage = "primary" | "preparatory" | "intermediate" | "secondary" | "cycle_1" | "cycle_2" | "cycle_3";
export type LibraryGrade = {
  countryCode: LibraryCountry;
  curriculumCode: LibraryCurriculum;
  gradeCode: string;
  gradeLabelEn: string;
  gradeLabelAr: string;
  stageCode: LibraryStage;
  stageLabelEn: string;
  stageLabelAr: string;
  cycleCode: "cycle_1" | "cycle_2" | "cycle_3" | null;
};

const egyptGrades: LibraryGrade[] = Array.from({ length: 12 }, (_, index) => {
  const number = index + 1;
  const stageCode: LibraryStage = number <= 6 ? "primary" : number <= 9 ? "preparatory" : "secondary";
  const stageLabelEn = stageCode === "primary" ? "Primary" : stageCode === "preparatory" ? "Preparatory" : "Secondary";
  const stageLabelAr = stageCode === "primary" ? "المرحلة الابتدائية" : stageCode === "preparatory" ? "المرحلة الإعدادية" : "المرحلة الثانوية";
  const gradeLabelEn = number <= 6 ? `Primary ${number}` : number <= 9 ? `Preparatory ${number - 6}` : `Secondary ${number - 9}`;
  const gradeLabelAr = number <= 6 ? `الصف ${number} الابتدائي` : number <= 9 ? `الصف ${number - 6} الإعدادي` : `الصف ${number - 9} الثانوي`;
  const gradeCode = number <= 6 ? `EG_P${number}` : number <= 9 ? `EG_PREP${number - 6}` : `EG_S${number - 9}`;
  return { countryCode: "EG", curriculumCode: "EG_MOE", gradeCode, gradeLabelEn, gradeLabelAr, stageCode, stageLabelEn, stageLabelAr, cycleCode: null };
});

const uaeGrades: LibraryGrade[] = Array.from({ length: 12 }, (_, index) => {
  const number = index + 1;
  const cycleCode: "cycle_1" | "cycle_2" | "cycle_3" = number <= 4 ? "cycle_1" : number <= 8 ? "cycle_2" : "cycle_3";
  const stageLabelEn = cycleCode === "cycle_1" ? "Cycle 1" : cycleCode === "cycle_2" ? "Cycle 2" : "Cycle 3";
  const stageLabelAr = cycleCode === "cycle_1" ? "الحلقة الأولى" : cycleCode === "cycle_2" ? "الحلقة الثانية" : "الحلقة الثالثة";
  return {
    countryCode: "AE",
    curriculumCode: "AE_MOE",
    gradeCode: `AE_G${number}`,
    gradeLabelEn: `Grade ${number}`,
    gradeLabelAr: `الصف ${number}`,
    stageCode: cycleCode,
    stageLabelEn,
    stageLabelAr,
    cycleCode,
  };
});

const saudiGrades: LibraryGrade[] = Array.from({ length: 12 }, (_, index) => {
  const number = index + 1;
  const stageCode: LibraryStage = number <= 6 ? "primary" : number <= 9 ? "intermediate" : "secondary";
  const stageLabelEn = stageCode === "primary" ? "Primary" : stageCode === "intermediate" ? "Intermediate" : "Secondary";
  const stageLabelAr = stageCode === "primary" ? "المرحلة الابتدائية" : stageCode === "intermediate" ? "المرحلة المتوسطة" : "المرحلة الثانوية";
  const stageGrade = number <= 6 ? number : number <= 9 ? number - 6 : number - 9;
  const gradeLabelEn = `${stageLabelEn} ${stageGrade}`;
  const stageLabelArShort = stageCode === "primary" ? "الابتدائي" : stageCode === "intermediate" ? "المتوسط" : "الثانوي";
  const gradeLabelAr = `الصف ${stageGrade} ${stageLabelArShort}`;
  const gradeCode = number <= 6 ? `SA_P${number}` : number <= 9 ? `SA_I${number - 6}` : `SA_S${number - 9}`;
  return { countryCode: "SA", curriculumCode: "SA_MOE", gradeCode, gradeLabelEn, gradeLabelAr, stageCode, stageLabelEn, stageLabelAr, cycleCode: null };
});

export function gradesForCountry(countryCode: LibraryCountry): LibraryGrade[] {
  if (countryCode === "EG") return egyptGrades;
  if (countryCode === "AE") return uaeGrades;
  return saudiGrades;
}

export function gradeForCode(countryCode: LibraryCountry, gradeCode: string): LibraryGrade | undefined {
  return gradesForCountry(countryCode).find(grade => grade.gradeCode === gradeCode);
}

export function localizedOption(option: { en: string; ar: string }, language: "ar" | "en"): string {
  return language === "ar" ? option.ar : option.en;
}

export function subjectCodesForSearch(query: string): LibrarySubject[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [];
  return LIBRARY_SUBJECTS
    .filter(subject => [subject.value, subject.en, subject.ar].some(label => label.toLocaleLowerCase().includes(normalizedQuery)))
    .map(subject => subject.value);
}
