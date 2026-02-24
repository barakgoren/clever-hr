import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// R2 is S3-compatible. Endpoint format: https://<accountId>.r2.cloudflarestorage.com
let _r2: S3Client | null = null;
function getR2(): S3Client {
  if (!_r2) {
    _r2 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _r2;
}

const bucket = () => process.env.R2_BUCKET_NAME!;

// Public base URL — set this to your R2 custom domain or r2.dev URL
// e.g. "https://assets.yourdomain.com" or "https://pub-xxxx.r2.dev"
const publicBase = () => process.env.R2_PUBLIC_URL!;

export const s3Service = {
  async upload(key: string, body: Buffer, contentType: string): Promise<void> {
    await getR2().send(
      new PutObjectCommand({ Bucket: bucket(), Key: key, Body: body, ContentType: contentType })
    );
  },

  // Private file — 15-min pre-signed URL
  async getPresignedUrl(key: string): Promise<string> {
    return getSignedUrl(getR2(), new GetObjectCommand({ Bucket: bucket(), Key: key }), {
      expiresIn: 900,
    });
  },

  // Pre-signed PUT for direct browser uploads (public assets)
  async getPutPresignedUrl(key: string, contentType: string): Promise<string> {
    return getSignedUrl(
      getR2(),
      new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }),
      { expiresIn: 300 }
    );
  },

  async delete(key: string): Promise<void> {
    await getR2().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
  },

  // Public URL for company hero/logo (served via R2 public domain)
  publicUrl(key: string): string {
    return `${publicBase()}/${key}`;
  },

  keys: {
    applicationFile: (companyId: number, applicationId: number, fieldId: string, filename: string) =>
      `companies/${companyId}/applications/${applicationId}/${fieldId}/${filename}`,
    heroImage: (companyId: number, filename: string) =>
      `companies/${companyId}/assets/hero/${filename}`,
    logoImage: (companyId: number, filename: string) =>
      `companies/${companyId}/assets/logo/${filename}`,
  },
};
