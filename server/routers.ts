import { COOKIE_NAME } from "@shared/const";
import { invokeLLM } from "./_core/llm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addChildProfile,
  changeBookingStatus,
  createTeacherReview,
  decodeList,
  getAdminOverview,
  getApprovedTeacherById,
  getBookingsForUser,
  getBookingsSummary,
  getBookingById,
  getChildForGuardian,
  getChildrenForGuardian,
  getPublicTeacherApplicationDocument,
  listPublicTeacherApplications,
  getReportsForGuardian,
  getTeacherProfileForUser,
  insertBooking,
  listPendingTeacherApplications,
  saveLessonReport,
  saveTeacherApplication,
  searchApprovedTeachers,
  savePublicTeacherApplication,
  setTeacherReviewState,
  updatePublicTeacherApplicationStatus,
} from "./db";
import { bookingRequests, teacherReviews, paymentAttempts } from "../drizzle/schema";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { canTransitionBookingStatus } from "./booking-state";
import { libraryRouter } from "./library-router";
import { preparePublicApplicationDocuments, publicApplicationDocumentsSchema } from "./teacher-application-documents";
import { cancelUnpaidBooking, completePaidBooking, createPaymobCheckout } from "./_core/paymob";

const supportedSubjects = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Arabic", "Islamic Education", "General Science", "Computer Science"] as const;
const supportedCurricula = ["UAE Ministry", "Egyptian Ministry", "Saudi Ministry", "British (IGCSE/GCSE/A-Level)", "American", "IB", "CBSE", "Other"] as const;

function normalizeTeacherPhone(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0020") || digits.startsWith("00971")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("01")) digits = `20${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("05")) digits = `971${digits.slice(1)}`;
  return digits;
}

const teacherFilter = z.object({
  query: z.string().max(120).optional(),
  subject: z.string().max(100).optional(),
  curriculum: z.string().max(120).optional(),
  grade: z.string().max(40).optional(),
  language: z.string().max(40).optional(),
  minPrice: z.number().int().min(0).optional(),
  maxPrice: z.number().int().min(0).optional(),
  minExperienceYears: z.number().int().min(0).max(60).optional(),
  minRating: z.number().min(1).max(5).optional(),
}).optional();

const teacherApplication = z.object({
  displayName: z.string().trim().min(2).max(160),
  nationality: z.string().trim().min(2).max(100),
  location: z.string().trim().min(2).max(120),
  qualification: z.string().trim().min(2).max(255),
  university: z.string().trim().min(2).max(200),
  specialization: z.string().trim().min(2).max(160),
  experienceYears: z.number().int().min(0).max(60),
  subjects: z.array(z.string().trim().min(1).max(100)).min(1).max(20),
  curricula: z.array(z.enum(supportedCurricula)).min(1).max(20),
  grades: z.array(z.string().trim().min(1).max(40)).min(1).max(12),
  languages: z.array(z.string().trim().min(1).max(40)).min(1).max(10),
  hourlyRate: z.number().int().min(20).max(3000),
  bio: z.string().trim().min(30).max(3000),
  teachingMethodology: z.string().trim().min(20).max(2000),
  introVideoUrl: z.string().url().max(1024).optional().or(z.literal("")),
});

export const publicTeacherApplicationSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  phone: z.string().trim().max(32).regex(/^\+?[0-9][0-9 ()-]{7,25}$/).refine(value => {
    const digitCount = value.replace(/\D/g, "").length;
    return digitCount >= 8 && digitCount <= 15;
  }, "Phone number must contain 8 to 15 digits"),
  email: z.string().trim().email().max(320).optional().or(z.literal("")),
  countryCode: z.enum(["EG", "AE", "SA", "both", "other"]),
  city: z.string().trim().min(2).max(120),
  subjects: z.array(z.enum(supportedSubjects)).min(1).max(supportedSubjects.length),
  curricula: z.array(z.enum(supportedCurricula)).min(1).max(supportedCurricula.length),
  grades: z.string().trim().min(1).max(300),
  experienceYears: z.number().int().min(0).max(60),
  languages: z.string().trim().min(2).max(120),
  qualificationSummary: z.string().trim().max(255).optional().or(z.literal("")),
  professionalSummary: z.string().trim().max(1500).optional().or(z.literal("")),
  contactConsent: z.literal(true),
  documents: publicApplicationDocumentsSchema.optional().default([]),
  website: z.string().max(180).optional(),
});

const publicApplicationAttempts = new Map<string, number[]>();
function allowPublicApplication(key: string) {
  const now = Date.now();
  const windowStart = now - 10 * 60 * 1000;
  const recent = (publicApplicationAttempts.get(key) ?? []).filter(timestamp => timestamp > windowStart);
  if (recent.length >= 3) return false;
  if (!publicApplicationAttempts.has(key) && publicApplicationAttempts.size >= 5000) {
    for (const [key, timestamps] of publicApplicationAttempts) {
      if (timestamps.every(timestamp => timestamp <= windowStart)) publicApplicationAttempts.delete(key);
      if (publicApplicationAttempts.size < 4500) break;
    }
    if (publicApplicationAttempts.size >= 5000) return false;
  }
  recent.push(now);
  publicApplicationAttempts.set(key, recent);
  return true;
}

export const appRouter = router({
  system: systemRouter,
  library: libraryRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  catalog: router({
    subjects: publicProcedure.query(() => supportedSubjects),
    curricula: publicProcedure.query(() => supportedCurricula),
  }),
  teachers: router({
    search: publicProcedure.input(teacherFilter).query(({ input }) => searchApprovedTeachers(input ?? {})),
    submitPublicApplication: publicProcedure.input(publicTeacherApplicationSchema).mutation(async ({ input }) => {
      if (input.website?.trim()) return { success: true };
      const normalizedPhone = normalizeTeacherPhone(input.phone);
      if (!allowPublicApplication(normalizedPhone)) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait before trying again." });
      }
      let documents;
      try {
        documents = preparePublicApplicationDocuments(input.documents);
      } catch {
        throw new TRPCError({ code: "BAD_REQUEST", message: "One or more uploaded documents are invalid." });
      }
      const result = await savePublicTeacherApplication({
        fullName: input.fullName,
        phone: input.phone.trim().replace(/\s+/g, " "),
        phoneNormalized: normalizedPhone,
        email: input.email || null,
        countryCode: input.countryCode,
        city: input.city,
        subjects: input.subjects,
        curricula: input.curricula,
        grades: input.grades,
        experienceYears: input.experienceYears,
        languages: input.languages,
        qualificationSummary: input.qualificationSummary || null,
        professionalSummary: input.professionalSummary || null,
        contactConsent: input.contactConsent,
      }, documents);
      if (!result.saved) {
        throw new TRPCError({ code: "CONFLICT", message: "An application from this phone was already submitted today." });
      }
      return { success: true };
    }),
    getById: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
      const result = await getApprovedTeacherById(input.id);
      if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Teacher profile not found" });
      return result;
    }),
    myProfile: protectedProcedure.query(({ ctx }) => getTeacherProfileForUser(ctx.user.id)),
    submitApplication: protectedProcedure.input(teacherApplication).mutation(({ ctx, input }) => saveTeacherApplication(ctx.user.id, {
      ...input,
      introVideoUrl: input.introVideoUrl || null,
    })),
    myBookings: protectedProcedure.query(({ ctx }) => getBookingsForUser(ctx.user.id)),
    updateBooking: protectedProcedure.input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["confirmed", "cancelled", "completed"]),
    })).mutation(async ({ ctx, input }) => {
      const booking = await getBookingById(input.id);
      const profile = await getTeacherProfileForUser(ctx.user.id);
      if (!booking || !profile || booking.teacherProfileId !== profile.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }
      if (!canTransitionBookingStatus(booking.status, input.status)) {
        throw new TRPCError({ code: "CONFLICT", message: "This booking status transition is not allowed" });
      }
      if (input.status === "cancelled") {
        try { return await cancelUnpaidBooking(input.id, booking.status as "requested" | "confirmed"); }
        catch (error) { throw new TRPCError({ code: "CONFLICT", message: error instanceof Error ? error.message : "Booking cancellation failed" }); }
      }
      if (input.status === "completed") {
        try { return await completePaidBooking(input.id); }
        catch (error) { throw new TRPCError({ code: "FORBIDDEN", message: error instanceof Error ? error.message : "Lesson completion failed" }); }
      }
      const updated = await changeBookingStatus(input.id, input.status, booking.status);
      if (!updated) throw new TRPCError({ code: "CONFLICT", message: "Booking changed; refresh and try again" });
      return updated;
    }),
    writeReport: protectedProcedure.input(z.object({
      bookingRequestId: z.number().int().positive(),
      attended: z.boolean(),
      summary: z.string().trim().min(10).max(3000),
      strengths: z.string().max(1500).optional(),
      areasToImprove: z.string().max(1500).optional(),
      homework: z.string().max(2000).optional(),
    })).mutation(async ({ ctx, input }) => {
      const [booking, profile] = await Promise.all([getBookingById(input.bookingRequestId), getTeacherProfileForUser(ctx.user.id)]);
      if (!booking || !profile || booking.teacherProfileId !== profile.id || booking.status !== "completed") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the assigned teacher can report a completed lesson" });
      }
      return saveLessonReport({ ...input, strengths: input.strengths || null, areasToImprove: input.areasToImprove || null, homework: input.homework || null, studentProfileId: booking.studentProfileId, teacherUserId: ctx.user.id });
    }),
  }),
  students: router({
    mine: protectedProcedure.query(({ ctx }) => getChildrenForGuardian(ctx.user.id)),
    create: protectedProcedure.input(z.object({
      fullName: z.string().trim().min(2).max(160),
      grade: z.string().min(1).max(40),
      curriculum: z.string().min(1).max(120),
    })).mutation(({ ctx, input }) => addChildProfile(ctx.user.id, input.fullName, input.grade, input.curriculum)),
    reports: protectedProcedure.query(({ ctx }) => getReportsForGuardian(ctx.user.id)),
  }),
  payments: router({
    startCheckout: protectedProcedure.input(z.object({
      bookingId: z.number().int().positive(),
      phoneNumber: z.string().trim().min(8).max(20),
      city: z.string().trim().max(64).optional(),
    })).mutation(async ({ ctx, input }) => {
      try {
        return await createPaymobCheckout({
          bookingId: input.bookingId,
          parentUserId: ctx.user.id,
          phoneNumber: input.phoneNumber,
          city: input.city,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Payment checkout could not be started";
        const code = /Database|Paymob.*required|PAYMOB_|not configured|unavailable/i.test(message) ? "SERVICE_UNAVAILABLE" : "BAD_REQUEST";
        throw new TRPCError({ code, message });
      }
    }),
  }),
  bookings: router({
    create: protectedProcedure.input(z.object({
      teacherProfileId: z.number().int().positive(),
      studentProfileId: z.number().int().positive().nullable().optional(),
      subject: z.string().trim().min(1).max(100),
      curriculum: z.string().trim().min(1).max(120),
      grade: z.string().trim().min(1).max(40),
      scheduledAt: z.string().datetime(),
      durationMinutes: z.union([z.literal(30), z.literal(45), z.literal(60), z.literal(90)]),
      notes: z.string().max(1000).optional(),
    })).mutation(async ({ ctx, input }) => {
      const teacher = await getApprovedTeacherById(input.teacherProfileId);
      if (!teacher) throw new TRPCError({ code: "NOT_FOUND", message: "Teacher is not available" });
      if (!decodeList(teacher.subjects).includes(input.subject)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This teacher does not list the selected subject" });
      }
      const scheduledAt = new Date(input.scheduledAt);
      if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a future time" });
      }
      let curriculum = input.curriculum;
      let grade = input.grade;
      if (input.studentProfileId) {
        const child = await getChildForGuardian(ctx.user.id, input.studentProfileId);
        if (!child) throw new TRPCError({ code: "FORBIDDEN", message: "Student profile does not belong to this account" });
        curriculum = child.curriculum;
        grade = child.grade;
      }
      if (!decodeList(teacher.curricula).includes(curriculum) || !decodeList(teacher.grades).includes(grade)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The selected student curriculum or grade is not listed for this teacher" });
      }
      return insertBooking({
        parentUserId: ctx.user.id,
        studentProfileId: input.studentProfileId ?? null,
        teacherProfileId: input.teacherProfileId,
        subject: input.subject,
        curriculum,
        grade,
        scheduledAt,
        durationMinutes: input.durationMinutes,
        notes: input.notes || null,
        status: "requested",
      });
    }),
    mine: protectedProcedure.query(({ ctx }) => getBookingsForUser(ctx.user.id)),
    cancel: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const booking = await getBookingById(input.id);
      if (!booking || booking.parentUserId !== ctx.user.id || booking.status !== "requested") {
        throw new TRPCError({ code: "FORBIDDEN", message: "This request cannot be cancelled" });
      }
      try { return await cancelUnpaidBooking(input.id, "requested"); }
      catch (error) { throw new TRPCError({ code: "CONFLICT", message: error instanceof Error ? error.message : "Booking cancellation failed" }); }
    }),
    review: protectedProcedure.input(z.object({ bookingRequestId: z.number().int().positive(), rating: z.number().int().min(1).max(5), comment: z.string().max(1200).optional() })).mutation(async ({ ctx, input }) => {
      const booking = await getBookingById(input.bookingRequestId);
      if (!booking || booking.parentUserId !== ctx.user.id || booking.status !== "completed") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only a parent from a completed lesson can review" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database is unavailable" });
      const existing = await db.select({ id: teacherReviews.id }).from(teacherReviews).where(eq(teacherReviews.bookingRequestId, input.bookingRequestId)).limit(1);
      if (existing.length) throw new TRPCError({ code: "CONFLICT", message: "This lesson was already reviewed" });
      try {
        await createTeacherReview(input.bookingRequestId, booking.teacherProfileId, ctx.user.id, input.rating, input.comment || null);
      } catch (error) {
        const dbError = error as { code?: string; errno?: number };
        if (dbError.code === "ER_DUP_ENTRY" || dbError.errno === 1062) {
          throw new TRPCError({ code: "CONFLICT", message: "This lesson was already reviewed" });
        }
        throw error;
      }
      return { success: true };
    }),
  }),
  admin: router({
    overview: adminProcedure.query(() => getAdminOverview()),
    applications: adminProcedure.query(() => listPendingTeacherApplications()),
    publicTeacherApplications: adminProcedure.query(({ ctx }) => {
      ctx.res.setHeader("Cache-Control", "private, no-store");
      return listPublicTeacherApplications();
    }),
    publicTeacherApplicationDocument: adminProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input, ctx }) => {
      ctx.res.setHeader("Cache-Control", "private, no-store");
      const document = await getPublicTeacherApplicationDocument(input.id);
      if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Application document not found" });
      return {
        id: document.id,
        applicationId: document.applicationId,
        documentType: document.documentType,
        originalName: document.originalName,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        base64: document.fileContent.toString("base64"),
      };
    }),
    updatePublicTeacherApplication: adminProcedure.input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["contacted", "closed"]),
    })).mutation(async ({ input }) => {
      const result = await updatePublicTeacherApplicationStatus(input.id, input.status);
      if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Teacher application not found" });
      return result;
    }),
    bookings: adminProcedure.query(({ ctx }) => getBookingsForUser(ctx.user.id, true)),
    paymentOperations: adminProcedure.query(async ({ ctx }) => {
      ctx.res.setHeader("Cache-Control", "private, no-store");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Database is unavailable" });
      // Deliberately omit clientSecret, checkoutUrl, billing details and raw provider payloads.
      return db.select({
        id: paymentAttempts.id,
        bookingRequestId: paymentAttempts.bookingRequestId,
        status: paymentAttempts.status,
        currency: paymentAttempts.currency,
        amountMinor: paymentAttempts.amountMinor,
        platformAmountMinor: paymentAttempts.platformAmountMinor,
        teacherAmountMinor: paymentAttempts.teacherAmountMinor,
        paymobOrderId: paymentAttempts.paymobOrderId,
        paymobTransactionId: paymentAttempts.paymobTransactionId,
        createdAt: paymentAttempts.createdAt,
        capturedAt: paymentAttempts.capturedAt,
        subject: bookingRequests.subject,
        bookingStatus: bookingRequests.status,
      }).from(paymentAttempts)
        .leftJoin(bookingRequests, eq(paymentAttempts.bookingRequestId, bookingRequests.id))
        .orderBy(desc(paymentAttempts.createdAt))
        .limit(50);
    }),
    reviewTeacher: adminProcedure.input(z.object({ id: z.number().int().positive(), decision: z.enum(["approve", "reject"]), credentialsVerified: z.boolean(), isElite: z.boolean().optional() })).mutation(({ input }) => {
      if (input.decision === "approve" && !input.credentialsVerified) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Verify credentials before public approval" });
      }
      return setTeacherReviewState(input.id, input.decision === "approve", input.credentialsVerified, input.isElite);
    }),
    updateBooking: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["confirmed", "cancelled", "completed"]) })).mutation(async ({ input }) => {
      const booking = await getBookingById(input.id);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      if (!canTransitionBookingStatus(booking.status, input.status)) {
        throw new TRPCError({ code: "CONFLICT", message: "This booking status transition is not allowed" });
      }
      if (input.status === "cancelled") {
        try { return await cancelUnpaidBooking(input.id, booking.status as "requested" | "confirmed"); }
        catch (error) { throw new TRPCError({ code: "CONFLICT", message: error instanceof Error ? error.message : "Booking cancellation failed" }); }
      }
      if (input.status === "completed") {
        try { return await completePaidBooking(input.id); }
        catch (error) { throw new TRPCError({ code: "FORBIDDEN", message: error instanceof Error ? error.message : "Lesson completion failed" }); }
      }
      const updated = await changeBookingStatus(input.id, input.status, booking.status);
      if (!updated) throw new TRPCError({ code: "CONFLICT", message: "Booking changed; refresh and try again" });
      return updated;
    }),
  }),
  ai: router({
    tutor: publicProcedure.input(z.object({
      language: z.enum(["ar", "en"]).default("ar"),
      curriculum: z.string().optional(),
      grade: z.string().optional(),
      subject: z.string().optional(),
      mode: z.enum(["explain", "step_by_step", "quiz", "summary"]).default("explain"),
      messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2500) })).min(1).max(15),
    })).mutation(async ({ input }) => {
      const isArabic = input.language === "ar";
      const subjectText = input.subject || (isArabic ? "المادة العامة" : "General Subject");
      const gradeText = input.grade || (isArabic ? "المرحلة الدراسية" : "Grade Level");
      const curriculumText = input.curriculum || (isArabic ? "المناهج المعتمدة" : "Standard Curriculum");

      const modeInstructions = {
        explain: isArabic
          ? "الوضع: شرح مفاهيمي مبسط. اشرح الفكرة بوضوح تام، وقدم مثالاً توضيحياً واقعياً من الحياة اليومية، ثم اطرح سؤالاً تفاعلياً واحداً لتتأكد من استيعاب الطالب."
          : "Mode: Conceptual Explanation. Explain the idea clearly, give an intuitive real-world example, and ask one short guiding question to check understanding.",
        step_by_step: isArabic
          ? "الوضع: حل المسائل خطوة بخطوة. لا تعطِ الحل النهائي مباشرة! قسّم المسألة إلى خطوات متدرجة ووجه الطالب للخطوة التالية بأسلوب التفكير المنطقي."
          : "Mode: Step-by-Step Solver. Do not reveal the final answer immediately! Break down the problem logically and prompt the student to think through the next step.",
        quiz: isArabic
          ? "الوضع: تدريب واختبار سريع. اطرح سؤالاً تدريبياً أو مسألة تفاعلية ملائمة للصف والمنهج مع 3-4 خيارات أو طلب إجابة قصيرة، وشجع الطالب على الإجابة."
          : "Mode: Practice Quiz. Generate an interactive, curriculum-aligned exercise with options or short answer, encouraging the student to attempt it.",
        summary: isArabic
          ? "الوضع: تلخيص مركّز. لخّص الدرس أو المفهوم في نقاط رئيسية موجزة ومحددة مع التركيز على القوانين والمصطلحات الأساسية."
          : "Mode: Lesson Summary. Summarize key concepts into crisp bullet points highlighting essential definitions, rules, and formulas.",
      }[input.mode || "explain"];

      const systemPrompt = `You are "مساعد مِحور الذكي" (Mihwar AI Study Guide), a patient, highly knowledgeable AI educational tutor for students in the UAE, Egypt, Saudi Arabia, and international curricula.
Language: ${isArabic ? "Arabic (العربية الفصحى الواضحة والراقية)" : "English (clear and encouraging)"}.
Target Context: Curriculum: ${curriculumText}, Grade: ${gradeText}, Subject: ${subjectText}.
${modeInstructions}
Pedagogical Rules:
- Foster genuine comprehension and deep thinking rather than rote memorization.
- For math and science, write formulas clearly.
- Keep the tone encouraging, warm, respectful, and safe for young learners.
- Advise the student to always verify complex topics with their classroom teacher or approved textbook.
- Never ask for personal identities or passwords.`;

      try {
        const result = await invokeLLM({
          maxTokens: 750,
          messages: [
            { role: "system", content: systemPrompt },
            ...input.messages,
          ],
        });
        const content = result.choices?.[0]?.message?.content;
        if (typeof content === "string" && content.trim()) {
          return { content: content.trim() };
        }
      } catch (err) {
        // Graceful pedagogical fallback when external LLM API is unavailable
        const lastUserMsg = [...input.messages].reverse().find(m => m.role === "user")?.content || "";
        
        let fallbackReply = "";
        if (isArabic) {
          if (input.mode === "step_by_step") {
            fallbackReply = `أهلاً بك يا بطل في **مساعد مِحور الذكي** 💡\n\nبخصوص سؤالك حول: **"${lastUserMsg}"** في مادة **${subjectText}** (${curriculumText}):\n\n📌 **الخطوة الأولى في التفكير:**\n1. لنحدد أولاً المعطيات الأساسية والمطلوب إيجاده.\n2. ما هي القاعدة أو القانون الرياضي/العلمي الذي يربط بين هذه المعطيات؟\n\n✨ **فكر معي:** ما هي أول خطوة تراها مناسبة للبدء في حل هذه المسألة؟ شاركني محاولتك وسنكمل معاً خطوة بخطوة!`;
          } else if (input.mode === "quiz") {
            fallbackReply = `🎯 **تدريب سريع لاختبار فهمك في ${subjectText}:**\n\nبناءً على فكرة **"${lastUserMsg}"**:\n\n**السؤال:** أي من الخيارات التالية يمثل التطبيق الأدق لهذا المفهوم؟\n- **أ)** التطبيق المباشر بالاعتماد على الملاحظة.\n- **ب)** التحليل المنطقي ومطابقة الشروط الرياضية.\n- **ج)** الاستنتاج بناءً على التجارب السابقة.\n\nاختر الإجابة التي تراها صحيحة وسنشرح سبب صحتها معاً!`;
          } else if (input.mode === "summary") {
            fallbackReply = `📝 **ملخص الفكرة الأساسية في ${subjectText}:**\n\nحول موضوع: **${lastUserMsg}**\n\n• **المفهوم الجوهري:** هو حجر الأساس لفهم كيفية ترابط القوانين في هذا الباب.\n• **أهم النقاط:**\n  1. فهم التعريف النظري بدقة.\n  2. حفظ الوحدات والقوانين المستعملة.\n  3. الانتباه للتحويلات الرياضية.\n• **نصيحة مِحور:** راجع الأمثلة المحلولة في كتابك المدرسي وتأكد من حل مسألتين بيدك لترسيخ الفهم!`;
          } else {
            fallbackReply = `مرحباً بك! أنا **مساعد مِحور التعليمي الذكي** 🌟\n\nبخصوص استفسارك عن: **"${lastUserMsg}"** في مادة **${subjectText}** لمرحلة **${gradeText}** (${curriculumText}):\n\n💡 **الشرح والتوضيح:**\nهذا المفهوم يعتمد على فكرة بسيطة: عندما ننظر إلى كيفية عمل الأشياء من حولنا، نجد أن كل جزء يكمل الآخر وفق قواعد ثابتة ومحددة.\n\n🔍 **مثال تطبيقي:**\nتخيل أنك تبني بناءً متماسكاً؛ كل معلومة تمثل لبنة أساسية تمهد للخطوة التالية.\n\nهل تود أن نتعمق أكثر في خطوة معينة أو نجرب مسألة تطبيقية معاً؟`;
          }
        } else {
          fallbackReply = `Hello! I'm **Mihwar AI Study Guide** 🌟\n\nRegarding your question: **"${lastUserMsg}"** in **${subjectText}** (${curriculumText} - ${gradeText}):\n\n💡 **Core Explanation:**\nThis concept builds foundational reasoning. Let's break it down into manageable parts so you understand the "why" behind it, not just the formula.\n\n✨ **Next Step:** What is your current understanding of the first step? Let's work through it together!`;
        }
        return { content: fallbackReply };
      }

      return {
        content: isArabic
          ? "أهلاً بك! كيف يمكنني مساعدتك في دراستك اليوم؟ اختر موضوعاً أو مادة وسنبدأ معاً."
          : "Hello! How can I help you with your studies today? Feel free to ask any question."
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
