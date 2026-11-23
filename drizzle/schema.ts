import {
  boolean,
  customType,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/** Application identity for standalone Mihwar accounts. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});


/** Standalone email/password credentials; kept separate from the public user record. */
export const authCredentials = mysqlTable("auth_credentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});


/** Paymob checkout attempts; monetary values are integer minor units. */
export const paymentAttempts = mysqlTable("payment_attempts", {
  id: int("id").autoincrement().primaryKey(),
  bookingRequestId: int("bookingRequestId").notNull(),
  parentUserId: int("parentUserId").notNull(),
  teacherUserId: int("teacherUserId").notNull(),
  provider: varchar("provider", { length: 32 }).notNull().default("paymob"),
  currency: varchar("currency", { length: 3 }).notNull(),
  amountMinor: int("amountMinor").notNull(),
  platformAmountMinor: int("platformAmountMinor").notNull(),
  teacherAmountMinor: int("teacherAmountMinor").notNull(),
  commissionBps: int("commissionBps").notNull().default(3000),
  status: mysqlEnum("status", ["created", "pending_provider", "captured", "failed", "cancelled", "expired", "requires_review"]).notNull().default("created"),
  idempotencyKey: varchar("idempotencyKey", { length: 80 }).notNull().unique(),
  activeBookingId: int("activeBookingId").unique(),
  specialReference: varchar("specialReference", { length: 120 }).notNull().unique(),
  paymobIntentionId: varchar("paymobIntentionId", { length: 120 }),
  paymobOrderId: varchar("paymobOrderId", { length: 80 }).unique(),
  clientSecret: varchar("clientSecret", { length: 1024 }),
  checkoutUrl: varchar("checkoutUrl", { length: 2048 }),
  paymobTransactionId: varchar("paymobTransactionId", { length: 80 }).unique(),
  providerPayloadHash: varchar("providerPayloadHash", { length: 64 }),
  expiresAt: timestamp("expiresAt"),
  capturedAt: timestamp("capturedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  bookingIdx: index("payment_attempts_booking_idx").on(table.bookingRequestId),
  parentIdx: index("payment_attempts_parent_idx").on(table.parentUserId),
  statusIdx: index("payment_attempts_status_idx").on(table.status),
}));

/** Paymob transaction callbacks are recorded once; the transaction ID is the provider event key. */
export const providerWebhookEvents = mysqlTable("provider_webhook_events", {
  id: int("id").autoincrement().primaryKey(),
  provider: varchar("provider", { length: 32 }).notNull(),
  providerEventId: varchar("providerEventId", { length: 120 }).notNull(),
  paymentAttemptId: int("paymentAttemptId"),
  signatureValid: boolean("signatureValid").notNull(),
  payloadHash: varchar("payloadHash", { length: 64 }).notNull(),
  processingStatus: mysqlEnum("processingStatus", ["received", "processed", "duplicate", "rejected", "needs_review"]).notNull().default("received"),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
}, (table) => ({
  providerEventUnique: uniqueIndex("provider_webhook_event_unique").on(table.provider, table.providerEventId),
  paymentIdx: index("provider_webhook_payment_idx").on(table.paymentAttemptId),
}));

/** Append-only double-entry ledger. Each source/account pair can be posted once. */
export const financialLedgerEntries = mysqlTable("financial_ledger_entries", {
  id: int("id").autoincrement().primaryKey(),
  paymentAttemptId: int("paymentAttemptId").notNull(),
  sourceReference: varchar("sourceReference", { length: 160 }).notNull(),
  accountCode: varchar("accountCode", { length: 48 }).notNull(),
  entrySide: mysqlEnum("entrySide", ["debit", "credit"]).notNull(),
  amountMinor: int("amountMinor").notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  ledgerSourceAccountUnique: uniqueIndex("financial_ledger_source_account_unique").on(table.sourceReference, table.accountCode),
  paymentIdx: index("financial_ledger_payment_idx").on(table.paymentAttemptId),
}));

/** Teachers never appear in the public directory until an administrator approves them. */
export const teacherProfiles = mysqlTable("teacher_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  displayName: varchar("displayName", { length: 160 }).notNull(),
  nationality: varchar("nationality", { length: 100 }).notNull(),
  location: varchar("location", { length: 120 }).notNull(),
  qualification: varchar("qualification", { length: 255 }).notNull(),
  university: varchar("university", { length: 200 }).notNull(),
  specialization: varchar("specialization", { length: 160 }).notNull(),
  experienceYears: int("experienceYears").notNull(),
  subjects: text("subjects").notNull(),
  curricula: text("curricula").notNull(),
  grades: text("grades").notNull(),
  languages: text("languages").notNull(),
  hourlyRate: int("hourlyRate").notNull(),
  bio: text("bio").notNull(),
  teachingMethodology: text("teachingMethodology").notNull(),
  introVideoUrl: varchar("introVideoUrl", { length: 1024 }),
  weeklyAvailability: text("weeklyAvailability"),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "suspended"]).default("pending").notNull(),
  credentialsVerified: boolean("credentialsVerified").default(false).notNull(),
  isElite: boolean("isElite").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Public teacher interest forms are private leads, not user accounts or approved profiles. */
export const teacherPublicApplications = mysqlTable("teacher_public_applications", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  phoneNormalized: varchar("phoneNormalized", { length: 15 }).notNull(),
  submissionDate: varchar("submissionDate", { length: 10 }),
  email: varchar("email", { length: 320 }),
  countryCode: mysqlEnum("countryCode", ["EG", "AE", "SA", "both", "other"]).notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  subjects: text("subjects").notNull(),
  curricula: text("curricula").notNull(),
  grades: varchar("grades", { length: 300 }).notNull(),
  experienceYears: int("experienceYears").notNull(),
  languages: varchar("languages", { length: 120 }).notNull(),
  qualificationSummary: varchar("qualificationSummary", { length: 255 }),
  professionalSummary: text("professionalSummary"),
  contactConsent: boolean("contactConsent").notNull(),
  consentedAt: timestamp("consentedAt").defaultNow().notNull(),
  status: mysqlEnum("status", ["pending", "contacted", "closed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  phoneDailyUnique: uniqueIndex("teacher_public_app_phone_day_uq").on(table.phoneNormalized, table.submissionDate),
  statusCreatedIndex: index("teacher_public_app_status_created_idx").on(table.status, table.createdAt),
}));

const mediumBlob = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "mediumblob",
});

/** Private teacher-application attachments; never exposed as public storage URLs. */
export const teacherPublicApplicationDocuments = mysqlTable("teacher_public_application_documents", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull().references(() => teacherPublicApplications.id, { onDelete: "cascade" }),
  documentType: mysqlEnum("documentType", ["qualification", "experience", "supporting"]).notNull(),
  originalName: varchar("originalName", { length: 180 }).notNull(),
  mimeType: mysqlEnum("mimeType", ["application/pdf", "image/jpeg", "image/png"]).notNull(),
  fileSize: int("fileSize").notNull(),
  fileContent: mediumBlob("fileContent").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  applicationIndex: index("teacher_public_app_doc_app_idx").on(table.applicationId, table.id),
}));

/** Children are private records owned by a parent/guardian account. */
export const studentProfiles = mysqlTable("student_profiles", {
  id: int("id").autoincrement().primaryKey(),
  guardianUserId: int("guardianUserId").notNull(),
  fullName: varchar("fullName", { length: 160 }).notNull(),
  grade: varchar("grade", { length: 40 }).notNull(),
  curriculum: varchar("curriculum", { length: 120 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** A request is not a confirmed booking until the teacher accepts it. */
export const bookingRequests = mysqlTable("booking_requests", {
  id: int("id").autoincrement().primaryKey(),
  parentUserId: int("parentUserId").notNull(),
  studentProfileId: int("studentProfileId"),
  teacherProfileId: int("teacherProfileId").notNull(),
  subject: varchar("subject", { length: 100 }).notNull(),
  curriculum: varchar("curriculum", { length: 120 }).notNull(),
  grade: varchar("grade", { length: 40 }).notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  durationMinutes: int("durationMinutes").notNull(),
  status: mysqlEnum("status", ["requested", "confirmed", "cancelled", "completed"]).default("requested").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Teacher-authored progress note for one completed lesson. */
export const lessonReports = mysqlTable("lesson_reports", {
  id: int("id").autoincrement().primaryKey(),
  bookingRequestId: int("bookingRequestId").notNull().unique(),
  studentProfileId: int("studentProfileId"),
  teacherUserId: int("teacherUserId").notNull(),
  attended: boolean("attended").notNull(),
  summary: text("summary").notNull(),
  strengths: text("strengths"),
  areasToImprove: text("areasToImprove"),
  homework: text("homework"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Reviews can only be added by a booking's parent after lesson completion. */
export const teacherReviews = mysqlTable("teacher_reviews", {
  id: int("id").autoincrement().primaryKey(),
  bookingRequestId: int("bookingRequestId").notNull().unique(),
  teacherProfileId: int("teacherProfileId").notNull(),
  reviewerUserId: int("reviewerUserId").notNull(),
  rating: int("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Curated curriculum resources; uploaded bytes stay in managed object storage. */
export const libraryResources = mysqlTable("library_resources", {
  id: int("id").autoincrement().primaryKey(),
  countryCode: mysqlEnum("countryCode", ["EG", "AE", "SA"]).notNull(),
  curriculumCode: varchar("curriculumCode", { length: 32 }).notNull(),
  stageCode: mysqlEnum("stageCode", ["primary", "preparatory", "intermediate", "secondary", "cycle_1", "cycle_2", "cycle_3"]).notNull(),
  cycleCode: mysqlEnum("cycleCode", ["cycle_1", "cycle_2", "cycle_3"]),
  gradeCode: varchar("gradeCode", { length: 16 }).notNull(),
  subjectCode: varchar("subjectCode", { length: 40 }).notNull(),
  termCode: mysqlEnum("termCode", ["term_1", "term_2", "year"]).default("year").notNull(),
  academicYear: varchar("academicYear", { length: 16 }),
  category: mysqlEnum("category", ["official_textbook", "authorized_reference", "study_notes", "past_exams", "question_bank"]).notNull(),
  format: mysqlEnum("format", ["pdf", "interactive_quiz", "video_summary", "external_link"]).notNull(),
  title: varchar("title", { length: 240 }).notNull(),
  description: text("description"),
  publisherName: varchar("publisherName", { length: 180 }),
  sourceUrl: varchar("sourceUrl", { length: 1024 }),
  externalUrl: varchar("externalUrl", { length: 1024 }),
  storageKey: varchar("storageKey", { length: 512 }),
  rightsType: mysqlEnum("rightsType", ["official_portal", "teacher_original", "licensed_use", "external_authorized_link"]).notNull(),
  rightsNote: text("rightsNote").notNull(),
  alignmentAuthority: varchar("alignmentAuthority", { length: 40 }),
  alignmentReference: varchar("alignmentReference", { length: 160 }),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "archived"]).default("pending").notNull(),
  uploaderUserId: int("uploaderUserId").notNull().references(() => users.id),
  uploaderTeacherProfileId: int("uploaderTeacherProfileId"),
  reviewerUserId: int("reviewerUserId").references(() => users.id),
  reviewNote: text("reviewNote"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  filterIndex: index("library_resources_filter_idx").on(table.countryCode, table.curriculumCode, table.gradeCode, table.subjectCode, table.termCode, table.status),
  categoryIndex: index("library_resources_category_idx").on(table.category, table.format, table.status),
  stageIndex: index("library_resources_stage_idx").on(table.stageCode, table.cycleCode, table.status),
  teacherUploaderForeignKey: foreignKey({
    name: "library_resources_teacher_uploader_fk",
    columns: [table.uploaderTeacherProfileId],
    foreignColumns: [teacherProfiles.id],
  }),
}));

/** One resumable PDF page marker per signed-in user and approved resource. */
export const libraryBookmarks = mysqlTable("library_bookmarks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  resourceId: int("resourceId").notNull().references(() => libraryResources.id),
  pageNumber: int("pageNumber").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  userResourceUnique: uniqueIndex("library_bookmarks_user_resource_uq").on(table.userId, table.resourceId),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type TeacherProfile = typeof teacherProfiles.$inferSelect;
export type InsertTeacherProfile = typeof teacherProfiles.$inferInsert;
export type TeacherPublicApplication = typeof teacherPublicApplications.$inferSelect;
export type TeacherPublicApplicationDocument = typeof teacherPublicApplicationDocuments.$inferSelect;
export type StudentProfile = typeof studentProfiles.$inferSelect;
export type BookingRequest = typeof bookingRequests.$inferSelect;
export type LessonReport = typeof lessonReports.$inferSelect;
export type LibraryResource = typeof libraryResources.$inferSelect;
export type LibraryBookmark = typeof libraryBookmarks.$inferSelect;
