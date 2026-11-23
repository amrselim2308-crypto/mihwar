import { randomUUID } from "node:crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

let s3: S3Client | null = null;
let publicS3: S3Client | null = null;

function normalizeKey(relKey: string): string {
  const key = relKey.replace(/^\/+/, "").replace(/\\/g, "/");
  if (!key || key.split("/").some(part => part === ".." || part === ".")) {
    throw new Error("Invalid storage key");
  }
  return key;
}

function appendHashSuffix(relKey: string): string {
  const key = normalizeKey(relKey);
  const hash = randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = key.lastIndexOf(".");
  if (lastDot === -1) return `${key}_${hash}`;
  return `${key.slice(0, lastDot)}_${hash}${key.slice(lastDot)}`;
}

function getS3(forPublicUrls = false): S3Client {
  if (forPublicUrls && publicS3) return publicS3;
  if (!forPublicUrls && s3) return s3;
  if (!ENV.s3Bucket || !ENV.s3Region || !ENV.s3AccessKeyId || !ENV.s3SecretAccessKey) {
    throw new Error("S3 storage is not configured. Set S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.");
  }
  const client = new S3Client({
    region: ENV.s3Region,
    endpoint: (forPublicUrls ? ENV.s3PublicEndpoint : ENV.s3Endpoint) || undefined,
    forcePathStyle: ENV.s3ForcePathStyle,
    credentials: {
      accessKeyId: ENV.s3AccessKeyId,
      secretAccessKey: ENV.s3SecretAccessKey,
    },
  });
  if (forPublicUrls) publicS3 = client;
  else s3 = client;
  return client;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(relKey);
  await getS3().send(new PutObjectCommand({
    Bucket: ENV.s3Bucket,
    Key: key,
    Body: typeof data === "string" ? Buffer.from(data) : data,
    ContentType: contentType,
    ServerSideEncryption: ENV.s3ServerSideEncryption ? "AES256" : undefined,
  }));
  return { key, url: `/storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  return getSignedUrl(getS3(true), new GetObjectCommand({ Bucket: ENV.s3Bucket, Key: key }), { expiresIn: 300 });
}
