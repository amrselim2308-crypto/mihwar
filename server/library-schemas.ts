import { z } from "zod";
import {
  LIBRARY_CATEGORIES,
  LIBRARY_COUNTRIES,
  LIBRARY_CURRICULUM_BY_COUNTRY,
  LIBRARY_CURRICULA,
  LIBRARY_FORMATS,
  LIBRARY_SUBJECTS,
  LIBRARY_TERMS,
  TEACHER_LIBRARY_CATEGORIES,
  gradeForCode,
} from "../shared/library-catalog";

function optionValues<T extends string>(options: readonly { value: T }[]): [T, ...T[]] {
  return options.map(option => option.value) as [T, ...T[]];
}

const httpsUrl = z.string().trim().url().max(1024).refine(value => value.startsWith("https://"), "Only HTTPS links are accepted");
const countryCode = z.enum(LIBRARY_COUNTRIES);
const termCode = z.enum(optionValues(LIBRARY_TERMS));
const subjectCode = z.enum(optionValues(LIBRARY_SUBJECTS));
const format = z.enum(optionValues(LIBRARY_FORMATS));
const teacherCategory = z.enum(TEACHER_LIBRARY_CATEGORIES);
const rightsType = z.enum(["teacher_original", "licensed_use", "external_authorized_link"]);

export const librarySearchSchema = z.object({
  countryCode: countryCode.optional(),
  curriculumCode: z.enum(LIBRARY_CURRICULA).optional(),
  gradeCode: z.string().max(16).optional(),
  subjectCode: subjectCode.optional(),
  termCode: termCode.optional(),
  category: z.enum(optionValues(LIBRARY_CATEGORIES)).optional(),
  format: format.optional(),
  query: z.string().trim().max(120).optional(),
  page: z.number().int().min(1).max(200).default(1),
  pageSize: z.number().int().min(1).max(50).default(24),
}).superRefine((value, ctx) => {
  if (value.countryCode && value.curriculumCode && value.curriculumCode !== LIBRARY_CURRICULUM_BY_COUNTRY[value.countryCode]) {
    ctx.addIssue({ code: "custom", path: ["curriculumCode"], message: "Curriculum does not belong to the selected country" });
  }
  if (value.gradeCode) {
    const gradeCode = value.gradeCode;
    const grade = value.countryCode
      ? gradeForCode(value.countryCode, gradeCode)
      : LIBRARY_COUNTRIES.map(country => gradeForCode(country, gradeCode)).find(Boolean);
    if (!grade) ctx.addIssue({ code: "custom", path: ["gradeCode"], message: "Grade does not belong to a supported country" });
    if (grade && value.curriculumCode && grade.curriculumCode !== value.curriculumCode) {
      ctx.addIssue({ code: "custom", path: ["curriculumCode"], message: "Curriculum does not match the selected grade" });
    }
  }
});

export const libraryContributionSchema = z.object({
  countryCode,
  gradeCode: z.string().min(1).max(16),
  subjectCode,
  termCode,
  category: teacherCategory,
  format,
  title: z.string().trim().min(3).max(240),
  description: z.string().trim().max(3000).optional(),
  academicYear: z.string().trim().regex(/^\d{4}(-\d{4})?$/).optional().or(z.literal("")),
  publisherName: z.string().trim().max(180).optional(),
  sourceUrl: httpsUrl.optional().or(z.literal("")),
  externalUrl: httpsUrl.optional().or(z.literal("")),
  fileBase64: z.string().max(7_000_000).optional(),
  rightsConfirmed: z.literal(true),
  rightsType,
  rightsNote: z.string().trim().min(20).max(2000),
  alignmentReference: z.string().trim().max(160).optional(),
}).superRefine((value, ctx) => {
  const grade = gradeForCode(value.countryCode, value.gradeCode);
  if (!grade) {
    ctx.addIssue({ code: "custom", path: ["gradeCode"], message: "Grade does not belong to the selected country" });
    return;
  }
  if (value.format === "pdf") {
    if (Boolean(value.fileBase64) === Boolean(value.externalUrl)) {
      ctx.addIssue({ code: "custom", path: ["fileBase64"], message: "Provide one PDF file or one external PDF link" });
    }
  } else if (!value.externalUrl || value.fileBase64) {
    ctx.addIssue({ code: "custom", path: ["externalUrl"], message: "Provide an HTTPS resource link for this format" });
  }
  if (value.category === "authorized_reference" && !["licensed_use", "external_authorized_link"].includes(value.rightsType)) {
    ctx.addIssue({ code: "custom", path: ["rightsType"], message: "Authorized references require a license or authorized source link" });
  }
  if (value.rightsType === "teacher_original" && !["study_notes", "question_bank"].includes(value.category)) {
    ctx.addIssue({ code: "custom", path: ["rightsType"], message: "Teacher-original uploads are limited to original study notes and question banks" });
  }
  if (value.rightsType !== "teacher_original" && value.fileBase64) {
    ctx.addIssue({ code: "custom", path: ["fileBase64"], message: "Licensed resources and past exams must be shared as external links, not uploaded copies" });
  }
  if (["licensed_use", "external_authorized_link"].includes(value.rightsType) && !value.sourceUrl) {
    ctx.addIssue({ code: "custom", path: ["sourceUrl"], message: "Provide the license or original source URL" });
  }
  if (["licensed_use", "external_authorized_link"].includes(value.rightsType) && !value.externalUrl) {
    ctx.addIssue({ code: "custom", path: ["externalUrl"], message: "Share the authorized resource through its original external URL" });
  }
});

export const libraryReviewSchema = z.object({
  resourceId: z.number().int().positive(),
  decision: z.enum(["approve", "reject", "archive"]),
  reviewNote: z.string().trim().max(2000).optional(),
  rightsVerified: z.literal(true).optional(),
}).superRefine((value, ctx) => {
  if (value.decision === "approve" && value.rightsVerified !== true) {
    ctx.addIssue({ code: "custom", path: ["rightsVerified"], message: "Confirm that the source and redistribution rights were reviewed" });
  }
  if (value.decision !== "approve" && value.rightsVerified) {
    ctx.addIssue({ code: "custom", path: ["rightsVerified"], message: "Rights confirmation is only applicable to approval" });
  }
});

export type LibrarySearchInput = z.infer<typeof librarySearchSchema>;
export type LibraryContributionInput = z.infer<typeof libraryContributionSchema>;
