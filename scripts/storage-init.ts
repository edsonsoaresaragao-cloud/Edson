import "dotenv/config";
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { s3, bucket } from "../src/lib/storage";
async function main() {
  const client = s3();
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket() }));
  } catch (e) {
    if (
      (e as { $metadata?: { httpStatusCode?: number } }).$metadata
        ?.httpStatusCode !== 404
    )
      throw e;
    await client.send(new CreateBucketCommand({ Bucket: bucket() }));
  }
  await client.send(
    new PutBucketCorsCommand({
      Bucket: bucket(),
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: [
              new URL(process.env.APP_URL || "http://localhost:3000").origin,
            ],
            AllowedMethods: ["POST"],
            AllowedHeaders: ["*"],
            MaxAgeSeconds: 600,
          },
        ],
      },
    }),
  );
  console.log("Bucket privado e CORS configurados.");
}
main().catch((e) => {
  console.error(
    "Falha ao configurar bucket:",
    e.name,
    e.$metadata?.httpStatusCode,
  );
  process.exitCode = 1;
});
