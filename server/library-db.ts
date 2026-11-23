import { and, desc, eq, inArray, like, or } from "drizzle-orm";
import { libraryBookmarks, libraryResources, teacherProfiles } from "../drizzle/schema";
import { gradeForCode, subjectCodesForSearch } from "../shared/library-catalog";
import { getDb } from "./db";
import type { LibrarySearchInput, LibraryContributionInput } from "./library-schemas";

export function toPublicLibraryResource(row: typeof libraryResources.$inferSelect) {
  const privateFields = new Set(["storageKey", "uploaderUserId", "uploaderTeacherProfileId", "reviewerUserId", "reviewNote", "reviewedAt"]);
  const publicFields = Object.fromEntries(Object.entries(row).filter(([key]) => !privateFields.has(key))) as Omit<typeof row, "storageKey" | "uploaderUserId" | "uploaderTeacherProfileId" | "reviewerUserId" | "reviewNote" | "reviewedAt">;
  return { ...publicFields, hasFile: Boolean(row.storageKey) };
}

export async function listLibraryResources(filters: LibrarySearchInput) {
  const db = await getDb();
  if (!db) return { items: [], hasMore: false, page: filters.page, pageSize: filters.pageSize };
  const conditions = [eq(libraryResources.status, "approved" as const)];
  if (filters.countryCode) conditions.push(eq(libraryResources.countryCode, filters.countryCode));
  if (filters.curriculumCode) conditions.push(eq(libraryResources.curriculumCode, filters.curriculumCode));
  if (filters.gradeCode) conditions.push(eq(libraryResources.gradeCode, filters.gradeCode));
  if (filters.subjectCode) conditions.push(eq(libraryResources.subjectCode, filters.subjectCode));
  if (filters.termCode) conditions.push(eq(libraryResources.termCode, filters.termCode));
  if (filters.category) conditions.push(eq(libraryResources.category, filters.category));
  if (filters.format) conditions.push(eq(libraryResources.format, filters.format));
  if (filters.query) {
    const term = `%${filters.query.replace(/[\\%_]/g, "\\$&")}%`;
    const searchable = [
      like(libraryResources.title, term),
      like(libraryResources.description, term),
      like(libraryResources.publisherName, term),
      like(libraryResources.subjectCode, term),
    ];
    const matchingSubjects = subjectCodesForSearch(filters.query);
    if (matchingSubjects.length) searchable.push(inArray(libraryResources.subjectCode, matchingSubjects));
    conditions.push(or(...searchable)!);
  }
  const rows = await db.select().from(libraryResources).where(and(...conditions))
    .orderBy(desc(libraryResources.createdAt), desc(libraryResources.id))
    .limit(filters.pageSize + 1).offset((filters.page - 1) * filters.pageSize);
  const hasMore = rows.length > filters.pageSize;
  return {
    items: rows.slice(0, filters.pageSize).map(toPublicLibraryResource),
    hasMore,
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

export async function getLibraryResourceById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(libraryResources).where(eq(libraryResources.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listLibraryBookmarks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    id: libraryBookmarks.id,
    resourceId: libraryBookmarks.resourceId,
    pageNumber: libraryBookmarks.pageNumber,
    savedAt: libraryBookmarks.updatedAt,
    resource: libraryResources,
  }).from(libraryBookmarks)
    .innerJoin(libraryResources, eq(libraryBookmarks.resourceId, libraryResources.id))
    .where(and(eq(libraryBookmarks.userId, userId), eq(libraryResources.status, "approved" as const)))
    .orderBy(desc(libraryBookmarks.updatedAt)).limit(100);
  return rows.map(row => ({
    id: row.id,
    resourceId: row.resourceId,
    pageNumber: row.pageNumber,
    savedAt: row.savedAt,
    resource: toPublicLibraryResource(row.resource),
  }));
}

export async function saveLibraryBookmark(userId: number, resourceId: number, pageNumber: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(libraryBookmarks).values({ userId, resourceId, pageNumber }).onDuplicateKeyUpdate({
    set: { pageNumber, updatedAt: new Date() },
  });
  return { resourceId, pageNumber };
}

export async function deleteLibraryBookmark(userId: number, resourceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(libraryBookmarks).where(and(eq(libraryBookmarks.userId, userId), eq(libraryBookmarks.resourceId, resourceId)));
  return { success: true };
}

export async function createLibraryResource(
  input: Omit<LibraryContributionInput, "fileBase64"> & { storageKey: string | null; uploaderUserId: number; uploaderTeacherProfileId: number },
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const grade = gradeForCode(input.countryCode, input.gradeCode);
  if (!grade) throw new Error("Grade does not belong to selected country");
  const values = {
    countryCode: input.countryCode,
    curriculumCode: grade.curriculumCode,
    stageCode: grade.stageCode,
    cycleCode: grade.cycleCode,
    gradeCode: input.gradeCode,
    subjectCode: input.subjectCode,
    termCode: input.termCode,
    academicYear: input.academicYear || null,
    category: input.category,
    format: input.format,
    title: input.title,
    description: input.description || null,
    publisherName: input.publisherName || null,
    sourceUrl: input.sourceUrl || null,
    externalUrl: input.externalUrl || null,
    storageKey: input.storageKey,
    rightsType: input.rightsType,
    rightsNote: input.rightsNote,
    alignmentAuthority: input.alignmentReference
      ? input.countryCode === "AE" ? "ADEK" : input.countryCode === "SA" ? "Saudi MoE" : null
      : null,
    alignmentReference: input.alignmentReference || null,
    uploaderUserId: input.uploaderUserId,
    uploaderTeacherProfileId: input.uploaderTeacherProfileId,
    status: "pending" as const,
  };
  const result = await db.insert(libraryResources).values(values);
  const id = Number(result[0].insertId);
  const resource = await getLibraryResourceById(id);
  return resource ? toPublicLibraryResource(resource) : null;
}

export async function listPendingLibraryResources() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    resource: libraryResources,
    contributorName: teacherProfiles.displayName,
  }).from(libraryResources)
    .leftJoin(teacherProfiles, eq(libraryResources.uploaderTeacherProfileId, teacherProfiles.id))
    .where(eq(libraryResources.status, "pending" as const))
    .orderBy(desc(libraryResources.createdAt)).limit(100);
  return rows.map(row => ({ ...toPublicLibraryResource(row.resource), contributorName: row.contributorName ?? "" }));
}

export async function reviewLibraryResource(resourceId: number, reviewerUserId: number, decision: "approve" | "reject" | "archive", reviewNote: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const status = decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "archived";
  const [result] = await db.update(libraryResources).set({
    status,
    reviewerUserId,
    reviewNote: reviewNote || null,
    reviewedAt: new Date(),
  }).where(and(eq(libraryResources.id, resourceId), eq(libraryResources.status, "pending")));
  if (!result || typeof result !== "object" || !("affectedRows" in result) || result.affectedRows !== 1) return null;
  const resource = await getLibraryResourceById(resourceId);
  return resource ? toPublicLibraryResource(resource) : null;
}
