import { describe, expect, it } from "vitest";
import {
  MAX_PUBLIC_APPLICATION_DOCUMENT_BYTES,
  MAX_PUBLIC_APPLICATION_DOCUMENTS_BYTES,
  preparePublicApplicationDocuments,
  publicApplicationDocumentSchema,
  publicApplicationDocumentsSchema,
  type PublicApplicationDocumentInput,
} from "./teacher-application-documents";

function documentInput(
  bytes: Buffer,
  overrides: Partial<PublicApplicationDocumentInput> = {},
): PublicApplicationDocumentInput {
  return {
    documentType: "qualification",
    originalName: "degree.pdf",
    mimeType: "application/pdf",
    base64: bytes.toString("base64"),
    ...overrides,
  };
}

function pdfBytes(size = 32) {
  const bytes = Buffer.alloc(size, 0x20);
  Buffer.from("%PDF-").copy(bytes);
  return bytes;
}

describe("private teacher application document validation", () => {
  it("accepts supported file signatures and reports the exact byte length", () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00]);
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    const valid = [
      documentInput(pdfBytes()),
      documentInput(jpeg, { mimeType: "image/jpeg", originalName: "certificate.jpeg", documentType: "experience" }),
      documentInput(png, { mimeType: "image/png", originalName: "training.png", documentType: "supporting" }),
    ];

    const prepared = preparePublicApplicationDocuments(valid);
    expect(prepared.map(file => file.mimeType)).toEqual(["application/pdf", "image/jpeg", "image/png"]);
    expect(prepared.map(file => file.fileSize)).toEqual([32, jpeg.length, png.length]);
    expect(prepared.map(file => file.documentType)).toEqual(["qualification", "experience", "supporting"]);
  });

  it("rejects a declared MIME type that does not match the file signature", () => {
    expect(() => preparePublicApplicationDocuments([
      documentInput(Buffer.from("not really a PDF")),
    ])).toThrow(/does not match/);
  });

  it("rejects malformed base64, unsupported categories, and more than five documents", () => {
    expect(publicApplicationDocumentSchema.safeParse({
      ...documentInput(pdfBytes()),
      base64: "%%%",
    }).success).toBe(false);
    expect(publicApplicationDocumentSchema.safeParse({
      ...documentInput(pdfBytes()),
      documentType: "identity",
    }).success).toBe(false);
    const sixDocuments = Array.from({ length: 6 }, () => documentInput(pdfBytes()));
    expect(publicApplicationDocumentsSchema.safeParse(sixDocuments).success).toBe(false);
    expect(() => preparePublicApplicationDocuments(sixDocuments)).toThrow(/Too many/);
  });

  it("rejects a file above 5 MB and all files together above 20 MB", () => {
    const oversized = pdfBytes(MAX_PUBLIC_APPLICATION_DOCUMENT_BYTES + 1);
    expect(() => preparePublicApplicationDocuments([documentInput(oversized)])).toThrow(/per-file/);

    const overTotalBytes = pdfBytes(4 * 1024 * 1024 + 1);
    const fiveMediumFiles = Array.from({ length: 5 }, (_, index) => documentInput(overTotalBytes, {
      originalName: `certificate-${index + 1}.pdf`,
    }));
    expect(overTotalBytes.length * fiveMediumFiles.length).toBeGreaterThan(MAX_PUBLIC_APPLICATION_DOCUMENTS_BYTES);
    expect(() => preparePublicApplicationDocuments(fiveMediumFiles)).toThrow(/total size/);
  });

  it("removes path/control characters and normalizes the filename extension", () => {
    const prepared = preparePublicApplicationDocuments([
      documentInput(pdfBytes(), { originalName: "../../degree\u0000.exe" }),
    ]);
    expect(prepared[0].originalName).not.toMatch(/[\\/\u0000-\u001f]/);
    expect(prepared[0].originalName.toLowerCase()).toMatch(/\.pdf$/);
  });
});
