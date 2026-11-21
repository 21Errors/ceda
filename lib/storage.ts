import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";

let cachedUploadsBucket: Files | null = null;

export function isUploadsStorageConfigured(): boolean {
  return Boolean(
    process.env.AWS_ENDPOINT_URL_S3?.trim() &&
      process.env.AWS_ACCESS_KEY_ID?.trim() &&
      process.env.AWS_SECRET_ACCESS_KEY?.trim(),
  );
}

export function getUploadsBucket(): Files {
  if (!cachedUploadsBucket) {
    cachedUploadsBucket = new Files({
      adapter: neon({ bucket: "uploads" }),
    });
  }
  return cachedUploadsBucket;
}

export const uploadsBucket: Files = new Proxy({} as Files, {
  get(_target, prop) {
    const bucket = getUploadsBucket();
    const value = Reflect.get(bucket, prop, bucket);
    return typeof value === "function" ? value.bind(bucket) : value;
  },
});
