import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { gradeForCode } from "../shared/library-catalog";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getTeacherProfileForUser } from "./db";
import { storageGetSignedUrl, storagePut } from "./storage";
import {
  createLibraryResource,
  deleteLibraryBookmark,
  getLibraryResourceById,
  listLibraryBookmarks,
  listLibraryResources,
  listPendingLibraryResources,
  reviewLibraryResource,
  saveLibraryBookmark,
} from "./library-db";
import { libraryContributionSchema, libraryReviewSchema, librarySearchSchema } from "./library-schemas";

const idInput = z.object({ resourceId: z.number().int().positive() });
const bookmarkInput = idInput.extend({ pageNumber: z.number().int().min(1).max(100_000) });

export const libraryRouter = router({
  list: publicProcedure.input(librarySearchSchema).query(({ input }) => listLibraryResources(input)),
  saved: protectedProcedure.query(({ ctx }) => listLibraryBookmarks(ctx.user.id)),
  saveBookmark: protectedProcedure.input(bookmarkInput).mutation(async ({ ctx, input }) => {
    const resource = await getLibraryResourceById(input.resourceId);
    if (!resource || resource.status !== "approved" || resource.format !== "pdf") {
      throw new TRPCError({ code: "NOT_FOUND", message: "Approved PDF resource not found" });
    }
    return saveLibraryBookmark(ctx.user.id, input.resourceId, input.pageNumber);
  }),
  removeBookmark: protectedProcedure.input(idInput).mutation(({ ctx, input }) => deleteLibraryBookmark(ctx.user.id, input.resourceId)),
  canContribute: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getTeacherProfileForUser(ctx.user.id);
    return Boolean(profile && profile.status === "approved" && profile.credentialsVerified);
  }),
  downloadUrl: publicProcedure.input(idInput).query(async ({ ctx, input }) => {
    const resource = await getLibraryResourceById(input.resourceId);
    if (!resource?.storageKey) throw new TRPCError({ code: "NOT_FOUND", message: "Resource file not found" });
    const isPublic = resource.status === "approved";
    const isUploader = ctx.user?.id === resource.uploaderUserId;
    const isAdmin = ctx.user?.role === "admin";
    if (!isPublic && !isUploader && !isAdmin) throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
    try {
      return { url: await storageGetSignedUrl(resource.storageKey) };
    } catch {
      throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The resource file is temporarily unavailable" });
    }
  }),
  submitContribution: protectedProcedure.input(libraryContributionSchema).mutation(async ({ ctx, input }) => {
    const profile = await getTeacherProfileForUser(ctx.user.id);
    if (!profile || profile.status !== "approved" || !profile.credentialsVerified) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only credential-reviewed teachers may contribute" });
    }
    const grade = gradeForCode(input.countryCode, input.gradeCode);
    if (!grade) throw new TRPCError({ code: "BAD_REQUEST", message: "Grade does not belong to selected country" });

    let storageKey: string | null = null;
    if (input.fileBase64) {
      const bytes = Buffer.from(input.fileBase64, "base64");
      if (bytes.byteLength === 0 || bytes.byteLength > 5 * 1024 * 1024 || bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Upload a valid PDF file up to 5 MB" });
      }
      try {
        const uploaded = await storagePut(`mihwar/library/${randomUUID()}.pdf`, bytes, "application/pdf");
        storageKey = uploaded.key;
      } catch {
        throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "File storage is temporarily unavailable" });
      }
    }

    try {
      return await createLibraryResource({
        ...input,
        countryCode: grade.countryCode,
        storageKey,
        uploaderUserId: ctx.user.id,
        uploaderTeacherProfileId: profile.id,
      });
    } catch (error) {
      console.error("[Library] Failed to record teacher contribution");
      throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "The contribution could not be saved" });
    }
  }),
  reviewQueue: adminProcedure.query(() => listPendingLibraryResources()),
  review: adminProcedure.input(libraryReviewSchema).mutation(async ({ ctx, input }) => {
    const resource = await getLibraryResourceById(input.resourceId);
    if (!resource || resource.status !== "pending") throw new TRPCError({ code: "NOT_FOUND", message: "Pending resource not found" });
    if (input.decision === "approve") {
      if (!resource.rightsNote.trim() || (!resource.storageKey && !resource.externalUrl) || input.rightsVerified !== true) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Confirm the rights review and verify the resource source before approval" });
      }
      if (resource.rightsType === "teacher_original" && !["study_notes", "question_bank"].includes(resource.category)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Teacher-original files are only publishable as original study notes or question banks" });
      }
      if (resource.rightsType !== "teacher_original" && (resource.storageKey || !resource.sourceUrl || !resource.externalUrl)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Licensed and past-exam materials must point to a verified authorized source, not an uploaded copy" });
      }
    }
    const reviewed = await reviewLibraryResource(input.resourceId, ctx.user.id, input.decision, input.reviewNote ?? "");
    if (!reviewed) throw new TRPCError({ code: "CONFLICT", message: "This resource was already reviewed. Refresh the review queue." });
    return reviewed;
  }),
});
