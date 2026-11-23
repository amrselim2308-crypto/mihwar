import { describe, expect, it } from "vitest";
import { gradesForCountry, subjectCodesForSearch } from "../shared/library-catalog";
import { libraryContributionSchema, libraryReviewSchema, librarySearchSchema } from "./library-schemas";

const validContribution = (overrides: Record<string, unknown> = {}) => ({
  countryCode: "EG",
  gradeCode: "EG_P1",
  subjectCode: "arabic",
  termCode: "term_1",
  category: "study_notes",
  format: "pdf",
  title: "Reading practice notes",
  externalUrl: "",
  fileBase64: "JVBERi0xLjQK",
  rightsConfirmed: true,
  rightsType: "teacher_original",
  rightsNote: "This is my original teaching material and I authorize its sharing.",
  ...overrides,
});

describe("Mihwar library taxonomy", () => {
  it("covers Egyptian Primary 1–6, Preparatory 1–3, and Secondary 1–3", () => {
    const grades = gradesForCountry("EG");
    expect(grades).toHaveLength(12);
    expect(grades.filter(grade => grade.stageCode === "primary").map(grade => grade.gradeCode)).toEqual(["EG_P1", "EG_P2", "EG_P3", "EG_P4", "EG_P5", "EG_P6"]);
    expect(grades.filter(grade => grade.stageCode === "preparatory").map(grade => grade.gradeCode)).toEqual(["EG_PREP1", "EG_PREP2", "EG_PREP3"]);
    expect(grades.filter(grade => grade.stageCode === "secondary").map(grade => grade.gradeCode)).toEqual(["EG_S1", "EG_S2", "EG_S3"]);
  });

  it("maps UAE MoE grades 1–12 into the three four-grade cycles", () => {
    const grades = gradesForCountry("AE");
    expect(grades).toHaveLength(12);
    expect(grades.filter(grade => grade.cycleCode === "cycle_1").map(grade => grade.gradeCode)).toEqual(["AE_G1", "AE_G2", "AE_G3", "AE_G4"]);
    expect(grades.filter(grade => grade.cycleCode === "cycle_2").map(grade => grade.gradeCode)).toEqual(["AE_G5", "AE_G6", "AE_G7", "AE_G8"]);
    expect(grades.filter(grade => grade.cycleCode === "cycle_3").map(grade => grade.gradeCode)).toEqual(["AE_G9", "AE_G10", "AE_G11", "AE_G12"]);
    expect(grades.every(grade => grade.curriculumCode === "AE_MOE")).toBe(true);
  });

  it("maps Saudi grades into primary 1–6, intermediate 1–3 and secondary 1–3", () => {
    const grades = gradesForCountry("SA");
    expect(grades).toHaveLength(12);
    expect(grades.filter(grade => grade.stageCode === "primary").map(grade => grade.gradeCode)).toEqual(["SA_P1", "SA_P2", "SA_P3", "SA_P4", "SA_P5", "SA_P6"]);
    expect(grades.filter(grade => grade.stageCode === "intermediate").map(grade => grade.gradeCode)).toEqual(["SA_I1", "SA_I2", "SA_I3"]);
    expect(grades.filter(grade => grade.stageCode === "secondary").map(grade => grade.gradeCode)).toEqual(["SA_S1", "SA_S2", "SA_S3"]);
    expect(grades.every(grade => grade.curriculumCode === "SA_MOE" && grade.cycleCode === null)).toBe(true);
    expect(grades.find(grade => grade.gradeCode === "SA_I2")?.gradeLabelAr).toBe("الصف 2 المتوسط");
  });
});

describe("library request validation", () => {
  it("rejects a grade from another country and a mismatched curriculum", () => {
    expect(librarySearchSchema.safeParse({ countryCode: "EG", gradeCode: "AE_G4" }).success).toBe(false);
    expect(librarySearchSchema.safeParse({ countryCode: "AE", curriculumCode: "EG_MOE", gradeCode: "AE_G4" }).success).toBe(false);
    expect(librarySearchSchema.safeParse({ curriculumCode: "AE_MOE", gradeCode: "EG_P1" }).success).toBe(false);
    expect(libraryContributionSchema.safeParse(validContribution({ countryCode: "AE", gradeCode: "EG_P1" })).success).toBe(false);
    expect(librarySearchSchema.safeParse({ countryCode: "SA", curriculumCode: "AE_MOE", gradeCode: "SA_I1" }).success).toBe(false);
    expect(librarySearchSchema.safeParse({ countryCode: "SA", gradeCode: "EG_P1" }).success).toBe(false);
    expect(libraryContributionSchema.safeParse(validContribution({ countryCode: "SA", gradeCode: "EG_P1" })).success).toBe(false);
    expect(libraryContributionSchema.safeParse(validContribution({ countryCode: "SA", gradeCode: "SA_I2" })).success).toBe(true);
  });

  it("requires affirmative rights acknowledgement and blocks teacher uploads of official textbooks", () => {
    expect(libraryContributionSchema.safeParse(validContribution({ rightsConfirmed: false })).success).toBe(false);
    expect(libraryContributionSchema.safeParse(validContribution({ category: "official_textbook" })).success).toBe(false);
    expect(libraryContributionSchema.safeParse(validContribution({ category: "authorized_reference", rightsType: "teacher_original" })).success).toBe(false);
    expect(libraryContributionSchema.safeParse(validContribution({ category: "past_exams", rightsType: "teacher_original" })).success).toBe(false);
    expect(libraryContributionSchema.safeParse(validContribution({ category: "study_notes", rightsType: "licensed_use", sourceUrl: "https://publisher.example/license", externalUrl: "https://publisher.example/resource" })).success).toBe(false);
  });

  it("requires source provenance for licensed references and links for non-PDF formats", () => {
    expect(libraryContributionSchema.safeParse(validContribution({ category: "authorized_reference", rightsType: "licensed_use" })).success).toBe(false);
    expect(libraryContributionSchema.safeParse(validContribution({ category: "authorized_reference", rightsType: "licensed_use", sourceUrl: "https://publisher.example/license", externalUrl: "https://publisher.example/resource.pdf", fileBase64: undefined })).success).toBe(true);
    expect(libraryContributionSchema.safeParse(validContribution({ category: "authorized_reference", rightsType: "licensed_use", sourceUrl: "https://publisher.example/license", externalUrl: "https://publisher.example/resource.pdf" })).success).toBe(false);
    expect(libraryContributionSchema.safeParse(validContribution({ category: "past_exams", rightsType: "external_authorized_link", sourceUrl: "https://ministry.example/exams", externalUrl: "https://ministry.example/exam.pdf", fileBase64: undefined })).success).toBe(true);
    expect(libraryContributionSchema.safeParse(validContribution({ format: "interactive_quiz", fileBase64: undefined, externalUrl: "" })).success).toBe(false);
    expect(libraryContributionSchema.safeParse(validContribution({ format: "interactive_quiz", fileBase64: undefined, externalUrl: "https://quiz.example/lesson", sourceUrl: "https://quiz.example/lesson" })).success).toBe(true);
  });

  it("requires an affirmative rights check before an administrator can publish", () => {
    expect(libraryReviewSchema.safeParse({ resourceId: 1, decision: "approve" }).success).toBe(false);
    expect(libraryReviewSchema.safeParse({ resourceId: 1, decision: "approve", rightsVerified: true }).success).toBe(true);
    expect(libraryReviewSchema.safeParse({ resourceId: 1, decision: "reject", rightsVerified: true }).success).toBe(false);
  });

  it("matches subject search using English and Arabic catalog labels", () => {
    expect(subjectCodesForSearch("math")).toContain("mathematics");
    expect(subjectCodesForSearch("الرياضيات")).toContain("mathematics");
  });
});
