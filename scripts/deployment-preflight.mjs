const required = [
  "DATABASE_URL",
  "SESSION_SECRET",
  "BOOTSTRAP_ADMIN_TOKEN",
  "MIHWAR_DOMAIN",
  "STORAGE_DOMAIN",
  "MYSQL_PASSWORD",
  "MYSQL_ROOT_PASSWORD",
  "S3_BUCKET",
  "S3_REGION",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_ENDPOINT",
  "S3_PUBLIC_ENDPOINT",
];
const missing = required.filter(key => !process.env[key] || process.env[key].startsWith("REPLACE_"));
const errors = [];
if (process.env.BOOTSTRAP_ADMIN_TOKEN && process.env.BOOTSTRAP_ADMIN_TOKEN.length < 32) {
  errors.push("BOOTSTRAP_ADMIN_TOKEN must contain at least 32 characters");
}
if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 64) {
  errors.push("SESSION_SECRET must contain at least 64 characters");
}
if (process.env.MYSQL_PASSWORD && process.env.MYSQL_PASSWORD === process.env.MYSQL_ROOT_PASSWORD) {
  errors.push("MYSQL_PASSWORD and MYSQL_ROOT_PASSWORD must be different");
}
console.log("Mihwar self-hosted deployment preflight");
if (missing.length) console.error(`Missing configuration: ${missing.join(", ")}`);
for (const error of errors) console.error(error);
if (!process.env.AI_API_KEY) console.warn("AI_API_KEY is empty: AI assistant features will remain unavailable.");
if (!process.env.GOOGLE_MAPS_BROWSER_KEY || !process.env.GOOGLE_MAPS_API_KEY) {
  console.warn("Google Maps keys are not configured: map-dependent features will remain unavailable.");
}
const paymobKeys = ["PAYMOB_BASE_URL", "PAYMOB_CHECKOUT_BASE_URL", "PAYMOB_SECRET_KEY", "PAYMOB_PUBLIC_KEY", "PAYMOB_HMAC_SECRET", "PAYMOB_PAYMENT_METHODS", "PAYMOB_CURRENCY", "PAYMOB_NOTIFICATION_URL", "PAYMOB_REDIRECTION_URL"];
const configuredPaymobKeys = paymobKeys.filter(key => !!process.env[key]);
if (configuredPaymobKeys.length > 0 && configuredPaymobKeys.length !== paymobKeys.length) {
  errors.push(`Paymob configuration is partial; configure all of: ${paymobKeys.join(", ")}`);
}
if (process.env.PAYMOB_CURRENCY && !["EGP", "AED", "SAR"].includes(process.env.PAYMOB_CURRENCY)) {
  errors.push("PAYMOB_CURRENCY must be EGP, AED or SAR");
}
if (process.env.PAYMOB_NOTIFICATION_URL && !process.env.PAYMOB_NOTIFICATION_URL.startsWith("https://")) {
  errors.push("PAYMOB_NOTIFICATION_URL must use public HTTPS");
}
if (process.env.PAYMOB_CURRENCY && process.env.PAYMOB_BASE_URL) {
  const expected = { EGP: "https://accept.paymob.com", AED: "https://uae.paymob.com", SAR: "https://ksa.paymob.com" }[process.env.PAYMOB_CURRENCY];
  if (expected && process.env.PAYMOB_BASE_URL.replace(/\/+$/, "") !== expected) errors.push("PAYMOB_BASE_URL does not match PAYMOB_CURRENCY region");
}
if (process.env.PAYMOB_PAYMENT_METHODS && !/^\d+(,\d+)*$/.test(process.env.PAYMOB_PAYMENT_METHODS.replace(/\s+/g, ""))) {
  errors.push("PAYMOB_PAYMENT_METHODS must be comma-separated numeric integration IDs");
}
if (configuredPaymobKeys.length === 0) console.warn("Paymob is not configured: checkout endpoints remain unavailable until merchant Sandbox credentials and callback URLs are added.");
console.warn("Before production launch, migrate existing users and stored files, complete Paymob Sandbox testing, payouts, video classroom, email verification and password-reset integrations.");
if (missing.length || errors.length) process.exitCode = 1;
