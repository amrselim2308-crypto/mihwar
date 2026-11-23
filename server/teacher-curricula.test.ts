import { describe, expect, it } from "vitest";
import { curricula } from "../client/src/lib/curricula";
import { publicTeacherApplicationSchema } from "./routers";

describe("Saudi curriculum teacher discovery", () => {
  it("offers Saudi Ministry in the shared teacher curriculum choices", () => {
    expect(curricula.some(item => item.value === "Saudi Ministry" && item.ar.includes("السعودية"))).toBe(true);
  });

  it("accepts a Saudi public teacher application with the Saudi Ministry curriculum", () => {
    const result = publicTeacherApplicationSchema.safeParse({
      fullName: "Saudi Teacher",
      phone: "+966 50 123 4567",
      countryCode: "SA",
      city: "Riyadh",
      subjects: ["Arabic"],
      curricula: ["Saudi Ministry"],
      grades: "Primary 1–6",
      experienceYears: 5,
      languages: "Arabic",
      contactConsent: true,
    });
    expect(result.success).toBe(true);
  });
});
