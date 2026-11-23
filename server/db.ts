import { and, desc, eq, gte, inArray, like, lte, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  bookingRequests,
  InsertTeacherProfile,
  InsertUser,
  lessonReports,
  studentProfiles,
  teacherPublicApplicationDocuments,
  teacherPublicApplications,
  teacherProfiles,
  teacherReviews,
  paymentAttempts,
  type TeacherProfile,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { canTransitionBookingStatus, type BookingStatus, type BookingTransitionTarget } from "./booking-state";
import type { PreparedPublicApplicationDocument } from "./teacher-application-documents";

let _db: ReturnType<typeof drizzle> | null = null;

/** Lazily connect so migrations and static tooling can run without a database. */
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    for (const field of textFields) {
      if (user[field] !== undefined) {
        const normalized = user[field] ?? null;
        values[field] = normalized;
        updateSet[field] = normalized;
      }
    }
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    values.lastSignedIn ??= new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return rows[0];
}

export type TeacherFilters = {
  query?: string;
  subject?: string;
  curriculum?: string;
  grade?: string;
  language?: string;
  minPrice?: number;
  maxPrice?: number;
  minExperienceYears?: number;
  minRating?: number;
};

export function decodeList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  } catch {
    // Older hand-entered values may be comma-separated.
  }
  return raw.split(",").map(value => value.trim()).filter(Boolean);
}

type PublicTeacherProfile = Omit<TeacherProfile, "userId" | "status" | "createdAt" | "updatedAt">;
type TeacherWithReviewStats = PublicTeacherProfile & { ratingAverage: number; reviewCount: number };

const publicTeacherColumns = {
  id: teacherProfiles.id,
  displayName: teacherProfiles.displayName,
  nationality: teacherProfiles.nationality,
  location: teacherProfiles.location,
  qualification: teacherProfiles.qualification,
  university: teacherProfiles.university,
  specialization: teacherProfiles.specialization,
  experienceYears: teacherProfiles.experienceYears,
  subjects: teacherProfiles.subjects,
  curricula: teacherProfiles.curricula,
  grades: teacherProfiles.grades,
  languages: teacherProfiles.languages,
  hourlyRate: teacherProfiles.hourlyRate,
  bio: teacherProfiles.bio,
  teachingMethodology: teacherProfiles.teachingMethodology,
  introVideoUrl: teacherProfiles.introVideoUrl,
  weeklyAvailability: teacherProfiles.weeklyAvailability,
  credentialsVerified: teacherProfiles.credentialsVerified,
  isElite: teacherProfiles.isElite,
};

async function attachReviewStats(rows: PublicTeacherProfile[]): Promise<TeacherWithReviewStats[]> {
  const db = await getDb();
  if (!db || rows.length === 0) return rows.map(row => ({ ...row, ratingAverage: 0, reviewCount: 0 }));
  const ids = rows.map(row => row.id as number);
  const reviews = await db.select({ teacherProfileId: teacherReviews.teacherProfileId, rating: teacherReviews.rating })
    .from(teacherReviews).where(inArray(teacherReviews.teacherProfileId, ids));
  const stats = new Map<number, { sum: number; count: number }>();
  for (const review of reviews) {
    const current = stats.get(review.teacherProfileId) ?? { sum: 0, count: 0 };
    current.sum += review.rating;
    current.count += 1;
    stats.set(review.teacherProfileId, current);
  }
  return rows.map(row => {
    const current = stats.get(row.id) ?? { sum: 0, count: 0 };
    return { ...row, ratingAverage: current.count ? current.sum / current.count : 0, reviewCount: current.count };
  });
}

export async function searchApprovedTeachers(filters: TeacherFilters = {}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(teacherProfiles.status, "approved" as const), eq(teacherProfiles.credentialsVerified, true)];
  if (filters.subject) conditions.push(like(teacherProfiles.subjects, `%${filters.subject}%`));
  if (filters.curriculum) conditions.push(like(teacherProfiles.curricula, `%${filters.curriculum}%`));
  if (filters.grade) conditions.push(like(teacherProfiles.grades, `%${filters.grade}%`));
  if (filters.language) conditions.push(like(teacherProfiles.languages, `%${filters.language}%`));
  if (filters.minPrice !== undefined) conditions.push(gte(teacherProfiles.hourlyRate, filters.minPrice));
  if (filters.maxPrice !== undefined) conditions.push(lte(teacherProfiles.hourlyRate, filters.maxPrice));
  if (filters.minExperienceYears !== undefined) conditions.push(gte(teacherProfiles.experienceYears, filters.minExperienceYears));
  if (filters.query) {
    const query = `%${filters.query}%`;
    conditions.push(or(like(teacherProfiles.displayName, query), like(teacherProfiles.specialization, query), like(teacherProfiles.bio, query))!);
  }
  const rows = await db.select(publicTeacherColumns).from(teacherProfiles).where(and(...conditions)).orderBy(desc(teacherProfiles.isElite), desc(teacherProfiles.createdAt)).limit(50);
  const withStats = await attachReviewStats(rows);
  return filters.minRating === undefined
    ? withStats
    : withStats.filter(teacher => teacher.reviewCount > 0 && teacher.ratingAverage >= filters.minRating!);
}

export async function getApprovedTeacherById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select(publicTeacherColumns).from(teacherProfiles).where(and(
    eq(teacherProfiles.id, id),
    eq(teacherProfiles.status, "approved"),
    eq(teacherProfiles.credentialsVerified, true),
  )).limit(1);
  return rows.length ? (await attachReviewStats(rows))[0] ?? null : null;
}

export async function getTeacherProfileForUser(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export type TeacherProfileInput = Omit<InsertTeacherProfile,
  "id" | "userId" | "status" | "credentialsVerified" | "isElite" | "createdAt" | "updatedAt" | "subjects" | "curricula" | "grades" | "languages" | "weeklyAvailability"
> & { subjects: string[]; curricula: string[]; grades: string[]; languages: string[] };

export async function saveTeacherApplication(userId: number, input: TeacherProfileInput) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await getTeacherProfileForUser(userId);
  const values = {
    ...input,
    userId,
    subjects: JSON.stringify(input.subjects),
    curricula: JSON.stringify(input.curricula),
    grades: JSON.stringify(input.grades),
    languages: JSON.stringify(input.languages),
    status: "pending" as const,
    credentialsVerified: false,
  };
  if (existing) {
    await db.update(teacherProfiles).set(values).where(eq(teacherProfiles.id, existing.id));
    return getTeacherProfileForUser(userId);
  }
  await db.insert(teacherProfiles).values(values);
  return getTeacherProfileForUser(userId);
}

export async function listPendingTeacherApplications() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teacherProfiles).where(eq(teacherProfiles.status, "pending")).orderBy(desc(teacherProfiles.createdAt));
}

export async function setTeacherReviewState(id: number, approved: boolean, credentialsVerified: boolean, isElite?: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(teacherProfiles).set({
    status: approved ? "approved" : "rejected",
    credentialsVerified: approved && credentialsVerified,
    ...(isElite === undefined ? {} : { isElite }),
  }).where(eq(teacherProfiles.id, id));
  const rows = await db.select().from(teacherProfiles).where(eq(teacherProfiles.id, id)).limit(1);
  return rows[0] ?? null;
}

export type PublicTeacherApplicationInput = {
  fullName: string;
  phone: string;
  phoneNormalized: string;
  email: string | null;
  countryCode: "EG" | "AE" | "SA" | "both" | "other";
  city: string;
  subjects: string[];
  curricula: string[];
  grades: string;
  experienceYears: number;
  languages: string;
  qualificationSummary: string | null;
  professionalSummary: string | null;
  contactConsent: true;
};

export async function savePublicTeacherApplication(
  input: PublicTeacherApplicationInput,
  documents: PreparedPublicApplicationDocument[] = [],
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const submissionDate = new Date().toISOString().slice(0, 10);

  try {
    const saved = await db.transaction(async tx => {
      const duplicate = await tx.select({ id: teacherPublicApplications.id })
        .from(teacherPublicApplications)
        .where(and(
          eq(teacherPublicApplications.phoneNormalized, input.phoneNormalized),
          eq(teacherPublicApplications.submissionDate, submissionDate),
        ))
        .limit(1);
      if (duplicate.length) return false;

      await tx.insert(teacherPublicApplications).values({
        ...input,
        submissionDate,
        subjects: JSON.stringify(input.subjects),
        curricula: JSON.stringify(input.curricula),
        status: "pending",
      });
      const applicationRows = await tx.select({ id: teacherPublicApplications.id })
        .from(teacherPublicApplications)
        .where(and(
          eq(teacherPublicApplications.phoneNormalized, input.phoneNormalized),
          eq(teacherPublicApplications.submissionDate, submissionDate),
        ))
        .limit(1);
      const applicationId = applicationRows[0]?.id;
      if (!applicationId) throw new Error("Could not resolve the saved teacher application");

      if (documents.length) {
        await tx.insert(teacherPublicApplicationDocuments).values(
          documents.map(document => ({ ...document, applicationId })),
        );
      }
      return true;
    });
    return { saved };
  } catch (error) {
    const dbError = error as { code?: string; errno?: number };
    if (dbError.code === "ER_DUP_ENTRY" || dbError.errno === 1062) return { saved: false };
    throw error;
  }
}

export async function listPublicTeacherApplications() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(teacherPublicApplications)
    .orderBy(desc(teacherPublicApplications.createdAt)).limit(100);
  const documentRows = rows.length
    ? await db.select({
      id: teacherPublicApplicationDocuments.id,
      applicationId: teacherPublicApplicationDocuments.applicationId,
      documentType: teacherPublicApplicationDocuments.documentType,
      originalName: teacherPublicApplicationDocuments.originalName,
      mimeType: teacherPublicApplicationDocuments.mimeType,
      fileSize: teacherPublicApplicationDocuments.fileSize,
      createdAt: teacherPublicApplicationDocuments.createdAt,
    }).from(teacherPublicApplicationDocuments)
      .where(inArray(teacherPublicApplicationDocuments.applicationId, rows.map(row => row.id)))
      .orderBy(teacherPublicApplicationDocuments.id)
    : [];
  const documentsByApplication = new Map<number, typeof documentRows>();
  for (const document of documentRows) {
    const existing = documentsByApplication.get(document.applicationId) ?? [];
    existing.push(document);
    documentsByApplication.set(document.applicationId, existing);
  }
  return rows.map(row => ({
    ...row,
    subjects: decodeList(row.subjects),
    curricula: decodeList(row.curricula),
    documents: documentsByApplication.get(row.id) ?? [],
  }));
}

export async function getPublicTeacherApplicationDocument(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({
    id: teacherPublicApplicationDocuments.id,
    applicationId: teacherPublicApplicationDocuments.applicationId,
    documentType: teacherPublicApplicationDocuments.documentType,
    originalName: teacherPublicApplicationDocuments.originalName,
    mimeType: teacherPublicApplicationDocuments.mimeType,
    fileSize: teacherPublicApplicationDocuments.fileSize,
    fileContent: teacherPublicApplicationDocuments.fileContent,
  }).from(teacherPublicApplicationDocuments)
    .innerJoin(teacherPublicApplications, eq(teacherPublicApplications.id, teacherPublicApplicationDocuments.applicationId))
    .where(eq(teacherPublicApplicationDocuments.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function updatePublicTeacherApplicationStatus(id: number, status: "contacted" | "closed") {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(teacherPublicApplications)
    .where(eq(teacherPublicApplications.id, id)).limit(1);
  if (!existing.length) return null;
  if (existing[0].status !== "closed") {
    await db.update(teacherPublicApplications).set({ status })
      .where(eq(teacherPublicApplications.id, id));
  }
  const rows = await db.select().from(teacherPublicApplications)
    .where(eq(teacherPublicApplications.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getChildrenForGuardian(guardianUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studentProfiles).where(eq(studentProfiles.guardianUserId, guardianUserId)).orderBy(desc(studentProfiles.createdAt));
}

export async function addChildProfile(guardianUserId: number, fullName: string, grade: string, curriculum: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(studentProfiles).values({ guardianUserId, fullName, grade, curriculum });
  return getChildrenForGuardian(guardianUserId);
}

export async function getChildForGuardian(guardianUserId: number, childId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(studentProfiles).where(and(eq(studentProfiles.id, childId), eq(studentProfiles.guardianUserId, guardianUserId))).limit(1);
  return rows[0] ?? null;
}

export async function getBookingsForUser(userId: number, admin = false) {
  const db = await getDb();
  if (!db) return [];
  const profile = await getTeacherProfileForUser(userId);
  const scope = admin ? undefined : profile
    ? or(eq(bookingRequests.parentUserId, userId), eq(bookingRequests.teacherProfileId, profile.id))
    : eq(bookingRequests.parentUserId, userId);
  const rows = await db.select().from(bookingRequests).where(scope).orderBy(desc(bookingRequests.scheduledAt)).limit(200);
  if (rows.length === 0) return [];
  const reviewRows = await db.select({ bookingRequestId: teacherReviews.bookingRequestId }).from(teacherReviews).where(eq(teacherReviews.reviewerUserId, userId));
  const reviewedBookingIds = new Set(reviewRows.map(row => row.bookingRequestId));
  const profileIds = [...new Set(rows.map(row => row.teacherProfileId))];
  const childIds = [...new Set(rows.map(row => row.studentProfileId).filter((id): id is number => id !== null))];
  const profiles = await db.select({ id: teacherProfiles.id, displayName: teacherProfiles.displayName }).from(teacherProfiles).where(inArray(teacherProfiles.id, profileIds));
  const children = childIds.length
    ? await db.select({ id: studentProfiles.id, fullName: studentProfiles.fullName, guardianUserId: studentProfiles.guardianUserId }).from(studentProfiles).where(inArray(studentProfiles.id, childIds))
    : [];
  const paymentRows = await db.select({
    bookingRequestId: paymentAttempts.bookingRequestId,
    status: paymentAttempts.status,
    amountMinor: paymentAttempts.amountMinor,
    currency: paymentAttempts.currency,
  }).from(paymentAttempts).where(inArray(paymentAttempts.bookingRequestId, rows.map(row => row.id))).orderBy(desc(paymentAttempts.id));
  const latestPayment = new Map<number, typeof paymentRows[number]>();
  for (const payment of paymentRows) if (!latestPayment.has(payment.bookingRequestId)) latestPayment.set(payment.bookingRequestId, payment);
  const names = new Map(profiles.map(row => [row.id, row.displayName]));
  const childNames = new Map(children.map(row => [row.id, row]));
  return rows.map(row => ({
    ...row,
    teacherName: names.get(row.teacherProfileId) ?? "",
    child: row.studentProfileId ? childNames.get(row.studentProfileId) ?? null : null,
    reviewedByUser: reviewedBookingIds.has(row.id),
    payment: latestPayment.get(row.id) ?? null,
  }));
}

export async function getBookingById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(bookingRequests).where(eq(bookingRequests.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function insertBooking(input: typeof bookingRequests.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(bookingRequests).values(input);
  const rows = await db.select().from(bookingRequests).where(and(
    eq(bookingRequests.parentUserId, input.parentUserId),
    eq(bookingRequests.teacherProfileId, input.teacherProfileId),
    eq(bookingRequests.scheduledAt, input.scheduledAt),
  )).orderBy(desc(bookingRequests.id)).limit(1);
  return rows[0] ?? null;
}

export async function changeBookingStatus(id: number, status: BookingTransitionTarget, expectedStatus: BookingStatus) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (!canTransitionBookingStatus(expectedStatus, status)) return null;
  await db.update(bookingRequests).set({ status }).where(and(
    eq(bookingRequests.id, id),
    eq(bookingRequests.status, expectedStatus),
  ));
  const rows = await db.select().from(bookingRequests).where(and(
    eq(bookingRequests.id, id),
    eq(bookingRequests.status, status),
  )).limit(1);
  return rows[0] ?? null;
}

export async function saveLessonReport(input: typeof lessonReports.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(lessonReports).values(input);
  return db.select().from(lessonReports).where(eq(lessonReports.bookingRequestId, input.bookingRequestId)).limit(1).then(rows => rows[0] ?? null);
}

export async function getReportsForGuardian(guardianUserId: number) {
  const db = await getDb();
  if (!db) return [];
  const children = await getChildrenForGuardian(guardianUserId);
  const childIds = children.map(child => child.id);
  if (childIds.length === 0) return [];
  const reports = await db.select().from(lessonReports).where(inArray(lessonReports.studentProfileId, childIds)).orderBy(desc(lessonReports.createdAt));
  if (reports.length === 0) return [];
  const bookingIds = reports.map(report => report.bookingRequestId);
  const bookings = await db.select().from(bookingRequests).where(inArray(bookingRequests.id, bookingIds));
  const bookingMap = new Map(bookings.map(booking => [booking.id, booking]));
  const teacherIds = [...new Set(bookings.map(booking => booking.teacherProfileId))];
  const teachers = await db.select({ id: teacherProfiles.id, displayName: teacherProfiles.displayName }).from(teacherProfiles).where(inArray(teacherProfiles.id, teacherIds));
  const teacherNames = new Map(teachers.map(teacher => [teacher.id, teacher.displayName]));
  const childMap = new Map(children.map(child => [child.id, child.fullName]));
  return reports.map(report => {
    const booking = bookingMap.get(report.bookingRequestId);
    return { ...report, subject: booking?.subject ?? "", scheduledAt: booking?.scheduledAt ?? report.createdAt, teacherName: booking ? teacherNames.get(booking.teacherProfileId) ?? "" : "", childName: report.studentProfileId ? childMap.get(report.studentProfileId) ?? "" : "" };
  });
}

export async function createTeacherReview(bookingId: number, teacherProfileId: number, reviewerUserId: number, rating: number, comment: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(teacherReviews).values({ bookingRequestId: bookingId, teacherProfileId, reviewerUserId, rating, comment });
}

export async function getBookingsSummary() {
  const db = await getDb();
  if (!db) return { total: 0, requested: 0, confirmed: 0, completed: 0 };
  const rows = await db.select().from(bookingRequests);
  return {
    total: rows.length,
    requested: rows.filter(row => row.status === "requested").length,
    confirmed: rows.filter(row => row.status === "confirmed").length,
    completed: rows.filter(row => row.status === "completed").length,
  };
}

export async function getAdminOverview() {
  const db = await getDb();
  if (!db) return { users: 0, teachers: 0, pendingTeachers: 0, students: 0, bookings: await getBookingsSummary() };
  const allUsers = await db.select({ id: users.id }).from(users);
  const allTeachers = await db.select().from(teacherProfiles);
  const children = await db.select({ id: studentProfiles.id }).from(studentProfiles);
  return {
    users: allUsers.length,
    teachers: allTeachers.filter(row => row.status === "approved" && row.credentialsVerified).length,
    pendingTeachers: allTeachers.filter(row => row.status === "pending").length,
    students: children.length,
    bookings: await getBookingsSummary(),
  };
}
