import { afterEach, describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { classifyCapturedAttempt, splitPaymobAmount, verifyPaymobHmac } from "./_core/paymob";

afterEach(() => {
  delete process.env.PAYMOB_HMAC_SECRET;
});

describe("Paymob payment primitives", () => {
  it("allocates the 30/70 split in integer minor units with the remainder assigned to the teacher", () => {
    expect(splitPaymobAmount(10000)).toEqual({ platform: 3000, teacher: 7000 });
    expect(splitPaymobAmount(101)).toEqual({ platform: 30, teacher: 71 });
    expect(splitPaymobAmount(1)).toEqual({ platform: 0, teacher: 1 });
  });

  it("verifies the official transaction callback HMAC field order and rejects tampering", () => {
    const obj = {
      amount_cents: 25000, created_at: "2026-11-23T00:00:00Z", currency: "EGP",
      error_occured: false, has_parent_transaction: false, id: 987654,
      integration_id: 12345, is_3d_secure: true, is_auth: false, is_capture: false,
      is_refunded: false, is_standalone_payment: true, is_voided: false,
      order: { id: 456789 }, owner: 1122, pending: false,
      source_data: { pan: "4242", sub_type: "Visa", type: "card" }, success: true,
    };
    const ordered = "250002026-11-23T00:00:00ZEGPfalsefalse98765412345truefalsefalsefalsetruefalse4567891122false4242Visacardtrue";
    const secret = "test-only-hmac-secret";
    process.env.PAYMOB_HMAC_SECRET = secret;
    const signature = crypto.createHmac("sha512", secret).update(ordered).digest("hex");
    expect(verifyPaymobHmac(obj, signature)).toBe(true);
    expect(verifyPaymobHmac(obj, signature.toUpperCase())).toBe(true); // Hex signatures are case-insensitive.
    expect(verifyPaymobHmac({ ...obj, amount_cents: 25001 }, signature)).toBe(false);
    expect(verifyPaymobHmac(obj, `${signature}garbage`)).toBe(false);
    expect(verifyPaymobHmac(obj, signature.slice(1))).toBe(false);
  });
});


describe("Paymob captured-payment idempotency", () => {
  it("treats a repeated transaction as an idempotent duplicate", () => {
    expect(classifyCapturedAttempt("captured", "tx-100", "tx-100")).toBe("duplicate");
  });

  it("flags a second transaction without reopening or downgrading the captured attempt", () => {
    expect(classifyCapturedAttempt("captured", "tx-100", "tx-200")).toBe("conflict");
  });

  it("allows normal processing only before capture", () => {
    expect(classifyCapturedAttempt("pending_provider", null, "tx-100")).toBe("continue");
  });
});
