import { z } from "zod";

export const MAX_PUBLIC_APPLICATION_DOCUMENTS = 5;
export const MAX_PUBLIC_APPLICATION_DOCUMENT_BYTES = 5 * 1024 * 1024;
export const MAX_PUBLIC_APPLICATION_DOCUMENTS_BYTES = 20 * 1024 * 1024;
const MAX_BASE64_CHARS = Math.ceil(MAX_PUBLIC_APPLICATION_DOCUMENT_BYTES / 3) * 4;

export const publicApplicationDocumentTypes = ["qualification", "experience", "supporting"] as const;
export const publicApplicationMimeTypes = ["application/pdf", "image/jpeg", "image/png"] as const;

const canonicalBase64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export const publicApplicationDocumentSchema = z.object({
  documentType: z.enum(publicApplicationDocumentTypes),
  originalName: z.string().trim().min(1).max(255),
  mimeType: z.enum(publicApplicationMimeTypes),
  base64: z.string().min(4).max(MAX_BASE64_CHARS).regex(canonicalBase64),
});

export const publicApplicationDocumentsSchema = z.array(publicApplicationDocumentSchema).max(MAX_PUBLIC_APPLICATION_DOCUMENTS);
export type PublicApplicationDocumentInput = z.infer<typeof publicApplicationDocumentSchema>;

export type PreparedPublicApplicationDocument = {
  documentType: PublicApplicationDocumentInput["documentType"];
  originalName: string;
  mimeType: PublicApplicationDocumentInput["mimeType"];
  fileSize: number;
  fileContent: Buffer;
};

function hasExpectedSignature(content: Buffer, mimeType: PublicApplicationDocumentInput["mimeType"]) {
  if (mimeType === "application/pdf") return content.length >= 5 && content.subarray(0, 5).toString("ascii") === "%PDF-";
  if (mimeType === "image/jpeg") return content.length >= 3 && content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff;
  return content.length >= 8 && content.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

function safeOriginalName(originalName: string, mimeType: PublicApplicationDocumentInput["mimeType"], index: number) {
  const extension = mimeType === "application/pdf" ? ".pdf" : mimeType === "image/jpeg" ? ".jpg" : ".png";
  let name = originalName.normalize("NFC")
    .replace(/[\u0000-\u001f\u007f/\\]/g, "_")
    .replace(/^\.+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/, "");
  if (!name) name = `application-document-${index + 1}`;
  if (!name.toLowerCase().endsWith(extension)) {
    name = name.replace(/\.[^.]{1,12}$/, "");
    name = `${name.slice(0, 180 - extension.length)}${extension}`;
  } else {
    name = name.slice(0, 180);
  }
  return name;
}

export function preparePublicApplicationDocuments(
  documents: PublicApplicationDocumentInput[],
): PreparedPublicApplicationDocument[] {
  if (documents.length > MAX_PUBLIC_APPLICATION_DOCUMENTS) {
    throw new Error("Too many application documents");
  }

  let totalBytes = 0;
  return documents.map((document, index) => {
    const fileContent = Buffer.from(document.base64, "base64");
    if (!fileContent.length || fileContent.toString("base64") !== document.base64) {
      throw new Error("Invalid base64 application document");
    }
    if (fileContent.length > MAX_PUBLIC_APPLICATION_DOCUMENT_BYTES) {
      throw new Error("Application document exceeds the per-file size limit");
    }
    totalBytes += fileContent.length;
    if (totalBytes > MAX_PUBLIC_APPLICATION_DOCUMENTS_BYTES) {
      throw new Error("Application documents exceed the total size limit");
    }
    if (!hasExpectedSignature(fileContent, document.mimeType)) {
      throw new Error("Application document content does not match its declared file type");
    }

    return {
      documentType: document.documentType,
      originalName: safeOriginalName(document.originalName, document.mimeType, index),
      mimeType: document.mimeType,
      fileSize: fileContent.length,
      fileContent,
    };
  });
}
