import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { AppError } from "./auth";
export function storageConfigured() {
  return !!(
    process.env.S3_ENDPOINT &&
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY &&
    process.env.S3_SECRET_KEY
  );
}
export function s3(publicClient = false) {
  if (!storageConfigured())
    throw new AppError("Armazenamento S3 pendente de configuração.", 503);
  return new S3Client({
    region: process.env.S3_REGION || "us-east-1",
    endpoint: publicClient
      ? process.env.S3_PUBLIC_ENDPOINT || process.env.S3_ENDPOINT
      : process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
  });
}
export const bucket = () => process.env.S3_BUCKET!;
export async function headObject(key: string) {
  return s3().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
}
export async function getObject(key: string) {
  return s3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
}
export async function putObject(key: string, body: Buffer, type: string) {
  return s3().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: body,
      ContentType: type,
    }),
  );
}
export async function deleteMediaObjects(id: string, originalKey: string) {
  const { ListObjectsV2Command, DeleteObjectsCommand } =
    await import("@aws-sdk/client-s3");
  const client = s3();
  let token: string | undefined;
  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket(),
        Prefix: `processed/${id}/`,
        ContinuationToken: token,
      }),
    );
    const keys = (page.Contents || []).map((o) => ({ Key: o.Key! }));
    if (keys.length)
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket(),
          Delete: { Objects: keys },
        }),
      );
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  await client.send(
    new DeleteObjectsCommand({
      Bucket: bucket(),
      Delete: { Objects: [{ Key: originalKey }] },
    }),
  );
}
