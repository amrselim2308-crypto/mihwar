import crypto from "node:crypto";
import type { Express, Request, Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { ENV } from "./env";
import { getDb } from "../db";
import {
  bookingRequests, teacherProfiles, users,
  paymentAttempts, providerWebhookEvents, financialLedgerEntries,
} from "../../drizzle/schema";

const ALLOWED_BASE_URLS = new Set([
  "https://accept.paymob.com",
  "https://ksa.paymob.com",
  "https://uae.paymob.com",
]);
const SUPPORTED_CURRENCIES = new Set(["EGP", "AED", "SAR"]);
const asText = (value: unknown) => value === null || value === undefined ? "" : String(value);
const getPath = (value: any, path: string[]) => path.reduce((acc, key) => acc?.[key], value as any);

function cfgRegionForCurrency(currency: string) {
  if (currency === "EGP") return "https://accept.paymob.com";
  if (currency === "SAR") return "https://ksa.paymob.com";
  if (currency === "AED") return "https://uae.paymob.com";
  throw new Error("Unsupported Paymob currency");
}
function parsePaymentMethods() {
  const ids = ENV.paymobPaymentMethods.split(",").map(v => Number(v.trim())).filter(v => Number.isSafeInteger(v) && v > 0);
  if (!ids.length) throw new Error("PAYMOB_PAYMENT_METHODS must contain one or more numeric integration IDs");
  return ids;
}
function paymobConfig() {
  const baseUrl = ENV.paymobBaseUrl.replace(/\/+$/, "");
  if (!ALLOWED_BASE_URLS.has(baseUrl)) throw new Error("PAYMOB_BASE_URL must be an approved Paymob regional origin");
  if (!ENV.paymobSecretKey || !ENV.paymobPublicKey || !ENV.paymobHmacSecret) throw new Error("Paymob secret, public and HMAC keys are required");
  if (!SUPPORTED_CURRENCIES.has(ENV.paymobCurrency)) throw new Error("PAYMOB_CURRENCY must be EGP, AED or SAR");
  if (baseUrl !== cfgRegionForCurrency(ENV.paymobCurrency)) throw new Error("PAYMOB_BASE_URL must match the configured PAYMOB_CURRENCY region");
  const checkoutUrl = new URL(ENV.paymobCheckoutBaseUrl);
  if (checkoutUrl.protocol !== "https:" || !checkoutUrl.hostname.endsWith(".checkout.paymob.com") || checkoutUrl.pathname !== "/" || checkoutUrl.search) {
    throw new Error("PAYMOB_CHECKOUT_BASE_URL must be a Paymob HTTPS checkout origin");
  }
  if (!ENV.paymobNotificationUrl.startsWith("https://")) throw new Error("PAYMOB_NOTIFICATION_URL must be a public HTTPS URL");
  if (!ENV.paymobRedirectionUrl.startsWith("https://")) throw new Error("PAYMOB_REDIRECTION_URL must be a public HTTPS URL");
  if (!Number.isInteger(ENV.paymobExpirationSeconds) || ENV.paymobExpirationSeconds < 900 || ENV.paymobExpirationSeconds > 86400) {
    throw new Error("PAYMOB_EXPIRATION_SECONDS must be an integer between 900 and 86400");
  }
  return { baseUrl, methods: parsePaymentMethods(), currency: ENV.paymobCurrency };
}
export function splitPaymobAmount(totalMinor: number) {
  const platform = Math.round(totalMinor * 3000 / 10000);
  return { platform, teacher: totalMinor - platform };
}
function makeCheckoutUrl(clientSecret: string) {
  paymobConfig();
  const url = new URL(ENV.paymobCheckoutBaseUrl);
  url.searchParams.set("publicKey", ENV.paymobPublicKey);
  url.searchParams.set("clientSecret", clientSecret);
  return url.toString();
}
function getHmacString(obj: any): string {
  const fields: Array<string[]> = [
    ["amount_cents"], ["created_at"], ["currency"], ["error_occured"],
    ["has_parent_transaction"], ["id"], ["integration_id"], ["is_3d_secure"],
    ["is_auth"], ["is_capture"], ["is_refunded"], ["is_standalone_payment"],
    ["is_voided"], ["order", "id"], ["owner"], ["pending"],
    ["source_data", "pan"], ["source_data", "sub_type"], ["source_data", "type"], ["success"],
  ];
  return fields.map(path => asText(getPath(obj, path))).join("");
}
export function verifyPaymobHmac(obj: any, received: string | undefined) {
  // SHA-512 is exactly 64 bytes / 128 hexadecimal characters. Validate the
  // complete encoding before Buffer.from(), which otherwise accepts a valid
  // hex prefix followed by malformed trailing characters.
  if (!received || !/^[a-f0-9]{128}$/i.test(received) || !ENV.paymobHmacSecret || !obj || typeof obj !== "object") return false;
  const expected = crypto.createHmac("sha512", ENV.paymobHmacSecret).update(getHmacString(obj), "utf8").digest();
  const supplied = Buffer.from(received, "hex");
  return supplied.length === expected.length && crypto.timingSafeEqual(expected, supplied);
}

/** A captured attempt is immutable: repeats are harmless, a second transaction is a reconciliation incident. */
export function classifyCapturedAttempt(status: string, storedTransactionId: string | null, incomingTransactionId: string) {
  if (status !== "captured") return "continue" as const;
  return storedTransactionId === incomingTransactionId ? "duplicate" as const : "conflict" as const;
}
function safeJsonHash(value: unknown) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
function duplicateKey(error: any) {
  return error?.code === "ER_DUP_ENTRY" || error?.errno === 1062;
}

export async function createPaymobCheckout(input: {
  bookingId: number; parentUserId: number; phoneNumber: string; city?: string;
}) {
  const cfg = paymobConfig();
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const [bookingRows] = await Promise.all([
    db.select().from(bookingRequests).where(and(
      eq(bookingRequests.id, input.bookingId),
      eq(bookingRequests.parentUserId, input.parentUserId),
    )).limit(1),
  ]);
  const booking = bookingRows[0];
  if (!booking) throw new Error("Booking not found");
  if (booking.status !== "confirmed") throw new Error("The teacher or platform must confirm this booking before payment");
  const [teacherRows, userRows] = await Promise.all([
    db.select().from(teacherProfiles).where(and(eq(teacherProfiles.id, booking.teacherProfileId), eq(teacherProfiles.status, "approved"), eq(teacherProfiles.credentialsVerified, true))).limit(1),
    db.select().from(users).where(eq(users.id, input.parentUserId)).limit(1),
  ]);
  const teacher = teacherRows[0];
  const parent = userRows[0];
  if (!teacher) throw new Error("Teacher is no longer eligible for bookings");
  if (!parent?.email) throw new Error("Add a valid email address to your account before payment");
  const normalizedPhone = input.phoneNumber.replace(/[^\d+]/g, "");
  if (!/^\+?[1-9]\d{7,14}$/.test(normalizedPhone)) throw new Error("Enter a valid international phone number");
  const totalMinor = Math.round(teacher.hourlyRate * booking.durationMinutes * 100 / 60);
  if (!Number.isSafeInteger(totalMinor) || totalMinor < 100) throw new Error("The lesson price is invalid");
  const shares = splitPaymobAmount(totalMinor);
  const idempotencyKey = `mihwar-booking-${booking.id}-${crypto.randomUUID()}`;
  const specialReference = `mihwar-${booking.id}-${crypto.randomUUID()}`;
  const expiresAt = new Date(Date.now() + Math.max(900, ENV.paymobExpirationSeconds || 3600) * 1000);

  // Reuse an existing, still-valid checkout for this booking; the DB unique key on activeBookingId
  // also prevents two browser tabs from opening parallel payment attempts.
  const latestAttempts = await db.select().from(paymentAttempts).where(and(
    eq(paymentAttempts.bookingRequestId, booking.id),
    eq(paymentAttempts.parentUserId, input.parentUserId),
  )).orderBy(desc(paymentAttempts.id)).limit(1);
  const latest = latestAttempts[0];
  if (latest?.status === "captured") throw new Error("This booking has already been paid");
  if (latest?.status === "requires_review") throw new Error("The previous payment needs manual reconciliation before another attempt");
  const existing = await db.select().from(paymentAttempts).where(and(
    eq(paymentAttempts.activeBookingId, booking.id),
    eq(paymentAttempts.parentUserId, input.parentUserId),
  )).limit(1);
  if (existing[0]?.status === "pending_provider" && existing[0].checkoutUrl && existing[0].expiresAt && existing[0].expiresAt > new Date()) {
    return { checkoutUrl: existing[0].checkoutUrl, amountMinor: existing[0].amountMinor, currency: existing[0].currency, reused: true };
  }
  if (existing[0]) {
    if (existing[0].status === "created" && Date.now() - existing[0].createdAt.getTime() < 30000) {
      throw new Error("A checkout is already being prepared; retry in a few seconds");
    }
    await db.update(paymentAttempts).set({
      status: existing[0].status === "created" ? "failed" : "expired",
      activeBookingId: null,
    }).where(eq(paymentAttempts.id, existing[0].id));
  }

  const inserted = await db.insert(paymentAttempts).values({
    bookingRequestId: booking.id, parentUserId: input.parentUserId, teacherUserId: teacher.userId,
    provider: "paymob", currency: cfg.currency, amountMinor: totalMinor,
    platformAmountMinor: shares.platform, teacherAmountMinor: shares.teacher,
    commissionBps: 3000, status: "created", idempotencyKey,
    activeBookingId: booking.id, specialReference,
    expiresAt,
  });
  const paymentAttemptId = Number((inserted as any).insertId);
  if (!paymentAttemptId) throw new Error("Could not create payment attempt");

  const names = (parent.name || "Mihwar Customer").trim().split(/\s+/);
  const firstName = names[0] || "Mihwar";
  const lastName = names.slice(1).join(" ") || "Customer";
  const country = cfg.currency === "AED" ? "AE" : cfg.currency === "SAR" ? "SA" : "EG";
  const amountLabel = `${booking.subject} lesson`;
  const payload = {
    amount: totalMinor,
    currency: cfg.currency,
    payment_methods: cfg.methods,
    items: [{ name: amountLabel, amount: totalMinor, description: `${booking.durationMinutes} minute lesson`, quantity: 1 }],
    billing_data: {
      apartment: "NA", first_name: firstName, last_name: lastName,
      street: "NA", building: "NA", phone_number: normalizedPhone,
      city: (input.city || "NA").slice(0, 64), country, email: parent.email,
      floor: "NA", state: "NA",
    },
    extras: { mihwar_payment_attempt_id: paymentAttemptId, mihwar_booking_id: booking.id },
    special_reference: specialReference,
    expiration: Math.max(900, ENV.paymobExpirationSeconds || 3600),
    notification_url: ENV.paymobNotificationUrl,
    redirection_url: ENV.paymobRedirectionUrl,
  };
  let providerRejected = false;
  try {
    const response = await fetch(`${cfg.baseUrl}/v1/intention/`, {
      method: "POST",
      headers: { Authorization: `Token ${ENV.paymobSecretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
    });
    const result: any = await response.json().catch(() => ({}));
    if (!response.ok) {
      providerRejected = response.status >= 400 && response.status < 500;
      const safeMessage = typeof result.detail === "string" ? result.detail.slice(0, 250) : `Paymob intention request failed (${response.status})`;
      throw new Error(safeMessage);
    }
    if (typeof result.client_secret !== "string" || !result.client_secret || result.intention_order_id === undefined || !result.id) {
      throw new Error("Paymob returned an incomplete intention response; reconciliation is required");
    }
    const checkoutUrl = makeCheckoutUrl(result.client_secret);
    await db.update(paymentAttempts).set({
      status: "pending_provider", paymobIntentionId: String(result.id),
      paymobOrderId: String(result.intention_order_id), clientSecret: result.client_secret,
      checkoutUrl, expiresAt,
    }).where(eq(paymentAttempts.id, paymentAttemptId));
    return { checkoutUrl, amountMinor: totalMinor, currency: cfg.currency, reused: false };
  } catch (error) {
    // A network timeout or malformed 2xx may mean Paymob created the intention
    // but the response was lost. Keep the booking locked for manual reconciliation.
    await db.update(paymentAttempts).set({
      status: providerRejected ? "failed" : "requires_review",
      activeBookingId: providerRejected ? null : booking.id,
    }).where(eq(paymentAttempts.id, paymentAttemptId));
    throw error;
  }
}

async function processTransactionCallback(obj: any, payloadHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const transactionId = asText(obj?.id);
  const orderId = asText(obj?.order?.id);
  if (!transactionId || !orderId) throw new Error("Callback is missing transaction/order identifiers");
  const eventId = `${transactionId}:${payloadHash.slice(0, 24)}`;
  try {
    await db.transaction(async (tx) => {
      await tx.insert(providerWebhookEvents).values({
        provider: "paymob", providerEventId: eventId, signatureValid: true,
        payloadHash, processingStatus: "received",
      });
      const rows = await tx.select().from(paymentAttempts).where(eq(paymentAttempts.paymobOrderId, orderId)).limit(1).for("update");
      const attempt = rows[0];
      const updateEvent = async (processingStatus: "processed" | "rejected" | "needs_review") => {
        await tx.update(providerWebhookEvents).set({
          paymentAttemptId: attempt?.id ?? null, processingStatus, processedAt: new Date(),
        }).where(and(eq(providerWebhookEvents.provider, "paymob"), eq(providerWebhookEvents.providerEventId, eventId)));
      };
      if (!attempt) { await updateEvent("rejected"); return; }
      const capturedState = classifyCapturedAttempt(attempt.status, attempt.paymobTransactionId, transactionId);
      if (capturedState === "duplicate") {
        await updateEvent("processed");
        return;
      }
      if (capturedState === "conflict") {
        // Never downgrade a captured payment or mutate its ledger because a
        // different transaction ID appears for the same Paymob order.
        await updateEvent("needs_review");
        return;
      }
      const currency = asText(obj.currency);
      const amount = Number(obj.amount_cents);
      const integrationId = Number(obj.integration_id);
      const configuredMethods = new Set(parsePaymentMethods());
      const capturedAmount = obj.paid_amount_cents ?? obj.captured_amount ?? obj.amount_cents;
      const amountOk = Number.isSafeInteger(amount) && amount === attempt.amountMinor &&
        (capturedAmount === null || capturedAmount === undefined || Number(capturedAmount) === attempt.amountMinor);
      const providerStateOk = obj.success === true && obj.pending === false &&
        obj.error_occured !== true && obj.is_voided !== true && obj.is_refunded !== true &&
        (obj.is_standalone_payment === true || obj.is_capture === true);
      if (currency !== attempt.currency || !amountOk || !configuredMethods.has(integrationId)) {
        await tx.update(paymentAttempts).set({ status: "requires_review", providerPayloadHash: payloadHash, activeBookingId: null }).where(eq(paymentAttempts.id, attempt.id));
        await updateEvent("needs_review");
        return;
      }
      if (obj.pending === true) {
        await updateEvent("processed");
        return;
      }
      if (!providerStateOk) {
        const terminalFailure = obj.success === false || obj.error_occured === true || obj.is_voided === true;
        if (terminalFailure) {
          await tx.update(paymentAttempts).set({ status: "failed", paymobTransactionId: transactionId, providerPayloadHash: payloadHash, activeBookingId: null }).where(eq(paymentAttempts.id, attempt.id));
          await updateEvent("processed");
        } else {
          await tx.update(paymentAttempts).set({ status: "requires_review", providerPayloadHash: payloadHash, activeBookingId: null }).where(eq(paymentAttempts.id, attempt.id));
          await updateEvent("needs_review");
        }
        return;
      }
      const bookingRows = await tx.select().from(bookingRequests).where(eq(bookingRequests.id, attempt.bookingRequestId)).limit(1).for("update");
      const booking = bookingRows[0];
      if (!booking || booking.status !== "confirmed" || attempt.status !== "pending_provider") {
        await tx.update(paymentAttempts).set({ status: "requires_review", paymobTransactionId: transactionId, providerPayloadHash: payloadHash, activeBookingId: null }).where(eq(paymentAttempts.id, attempt.id));
        await updateEvent("needs_review");
        return;
      }
      await tx.update(paymentAttempts).set({
        status: "captured", paymobTransactionId: transactionId,
        providerPayloadHash: payloadHash, capturedAt: new Date(), activeBookingId: null,
      }).where(eq(paymentAttempts.id, attempt.id));
      const sourceReference = `paymob-capture-${transactionId}`;
      await tx.insert(financialLedgerEntries).values([
        { paymentAttemptId: attempt.id, sourceReference, accountCode: "paymob_clearing", entrySide: "debit", amountMinor: attempt.amountMinor, currency: attempt.currency },
        { paymentAttemptId: attempt.id, sourceReference, accountCode: "platform_revenue", entrySide: "credit", amountMinor: attempt.platformAmountMinor, currency: attempt.currency },
        { paymentAttemptId: attempt.id, sourceReference, accountCode: "teacher_escrow", entrySide: "credit", amountMinor: attempt.teacherAmountMinor, currency: attempt.currency },
      ]);
      await updateEvent("processed");
    });
    return "processed";
  } catch (error) {
    if (duplicateKey(error)) return "duplicate";
    throw error;
  }
}

/** Cancel only when no active, captured, or ambiguous payment exists. */
export async function cancelUnpaidBooking(bookingId: number, expectedStatus: "requested" | "confirmed") {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const attempts = await tx.select().from(paymentAttempts).where(eq(paymentAttempts.bookingRequestId, bookingId)).for("update");
    if (attempts.some(attempt => ["created", "pending_provider", "captured", "requires_review"].includes(attempt.status))) {
      throw new Error("This booking has an active, captured, or unresolved payment; reconcile or refund it before cancellation");
    }
    const bookings = await tx.select().from(bookingRequests).where(eq(bookingRequests.id, bookingId)).limit(1).for("update");
    const booking = bookings[0];
    if (!booking || booking.status !== expectedStatus) throw new Error("Booking changed; refresh and try again");
    await tx.update(bookingRequests).set({ status: "cancelled" }).where(and(
      eq(bookingRequests.id, bookingId),
      eq(bookingRequests.status, expectedStatus),
    ));
    const updated = await tx.select().from(bookingRequests).where(eq(bookingRequests.id, bookingId)).limit(1);
    return updated[0];
  });
}

/**
 * Atomically completes a confirmed, paid lesson and releases the teacher's
 * escrowed share into the payable balance. The completion action is the
 * only point at which the teacher share becomes eligible for settlement.
 */
export async function completePaidBooking(bookingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.transaction(async (tx) => {
    const payments = await tx.select().from(paymentAttempts).where(and(
      eq(paymentAttempts.bookingRequestId, bookingId),
      eq(paymentAttempts.status, "captured"),
    )).limit(1).for("update");
    const payment = payments[0];
    if (!payment) throw new Error("A verified captured payment is required before completing this lesson");
    const bookings = await tx.select().from(bookingRequests).where(eq(bookingRequests.id, bookingId)).limit(1).for("update");
    const booking = bookings[0];
    if (!booking) throw new Error("Booking not found");
    if (booking.status !== "confirmed") throw new Error("Only a confirmed booking can be completed");
    await tx.update(bookingRequests).set({ status: "completed" }).where(and(
      eq(bookingRequests.id, bookingId),
      eq(bookingRequests.status, "confirmed"),
    ));
    const sourceReference = `teacher-earning-release-${payment.id}`;
    await tx.insert(financialLedgerEntries).values([
      { paymentAttemptId: payment.id, sourceReference, accountCode: "teacher_escrow", entrySide: "debit", amountMinor: payment.teacherAmountMinor, currency: payment.currency },
      { paymentAttemptId: payment.id, sourceReference, accountCode: "teacher_payable", entrySide: "credit", amountMinor: payment.teacherAmountMinor, currency: payment.currency },
    ]);
    const updated = await tx.select().from(bookingRequests).where(eq(bookingRequests.id, bookingId)).limit(1);
    return updated[0];
  });
}

export function registerPaymobWebhook(app: Express) {
  app.post("/api/payments/paymob/webhook", async (req: Request, res: Response) => {
    try {
      const body = req.body;
      if (Buffer.byteLength(JSON.stringify(body ?? null), "utf8") > 256 * 1024) {
        res.status(413).json({ ok: false, error: "Callback payload too large" });
        return;
      }
      if (body?.type !== "TRANSACTION" || !body?.obj) {
        res.status(400).json({ ok: false, error: "Unsupported callback type" });
        return;
      }
      const hmac = typeof req.query.hmac === "string" ? req.query.hmac : undefined;
      if (!verifyPaymobHmac(body.obj, hmac)) {
        res.status(401).json({ ok: false, error: "Invalid callback signature" });
        return;
      }
      const result = await processTransactionCallback(body.obj, safeJsonHash(body));
      res.status(200).json({ ok: true, result });
    } catch (error) {
      console.error("[Paymob webhook] Processing failed:", error instanceof Error ? error.message : "unknown");
      res.status(500).json({ ok: false });
    }
  });
}
