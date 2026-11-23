import { describe, expect, it } from "vitest";
import { curricula, curriculumLabel } from "../client/src/lib/curricula";
import { subjects } from "../client/src/pages/Home";

describe("Subjects Grid and Curriculum Integrity", () => {
  it("defines exactly 16 subjects for the 4x4 hero grid", () => {
    expect(subjects).toHaveLength(16);
  });

  it("ensures all 16 subjects have unique English and Arabic names", () => {
    const enNames = new Set(subjects.map(s => s.en));
    const arNames = new Set(subjects.map(s => s.ar));

    expect(enNames.size).toBe(16);
    expect(arNames.size).toBe(16);
  });

  it("covers essential core disciplines: Arabic, Math, Physics, Chemistry, Biology, CS & AI", () => {
    const enNames = subjects.map(s => s.en);
    expect(enNames).toContain("Arabic");
    expect(enNames).toContain("Mathematics");
    expect(enNames).toContain("Physics");
    expect(enNames).toContain("Chemistry");
    expect(enNames).toContain("Biology");
    expect(enNames).toContain("Computer Science & AI");
  });

  it("supports UAE, Egyptian, Saudi, and International curricula", () => {
    const values = curricula.map(c => c.value);
    expect(values).toContain("UAE Ministry");
    expect(values).toContain("Egyptian Ministry");
    expect(values).toContain("Saudi Ministry");
    expect(values).toContain("British / Cambridge");
    expect(values).toContain("American");
    expect(values).toContain("International Baccalaureate");
  });

  it("localizes curriculum labels correctly in Arabic and English", () => {
    expect(curriculumLabel("UAE Ministry", "ar")).toContain("الإمارات");
    expect(curriculumLabel("Egyptian Ministry", "ar")).toContain("مصر");
    expect(curriculumLabel("Saudi Ministry", "ar")).toContain("السعودية");
    expect(curriculumLabel("Saudi Ministry", "en")).toContain("Saudi");
  });
});
