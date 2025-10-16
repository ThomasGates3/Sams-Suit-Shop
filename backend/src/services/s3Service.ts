import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import dotenv from 'dotenv';

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

const cloudFrontClient = new CloudFrontClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const S3_BUCKET = process.env.S3_BUCKET_NAME || '';
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN_NAME || '';
const CLOUDFRONT_DISTRIBUTION_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID || '';

export class S3Service {
  /**
   * Upload a file to S3
   * @param key - S3 object key (path)
   * @param buffer - File buffer
   * @param contentType - MIME type
   * @returns CloudFront URL of uploaded file
   */
  static async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string
  ): Promise<string> {
    if (!S3_BUCKET) {
      throw new Error('S3_BUCKET_NAME environment variable not set');
    }

    try {
      const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        // Immutable assets cache for 1 year
        CacheControl: 'public, max-age=31536000, immutable',
      });

      await s3Client.send(command);

      // Return CloudFront URL
      const cloudFrontUrl = `https://${CLOUDFRONT_DOMAIN}/${key}`;
      return cloudFrontUrl;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw error;
    }
  }

  /**
   * Delete a file from S3
   * @param key - S3 object key (path)
   */
  static async deleteFile(key: string): Promise<void> {
    if (!S3_BUCKET) {
      throw new Error('S3_BUCKET_NAME environment variable not set');
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      });

      await s3Client.send(command);

      // Invalidate CloudFront cache
      if (CLOUDFRONT_DISTRIBUTION_ID) {
        await this.invalidateCloudFront([`/${key}`]);
      }
    } catch (error) {
      console.error('S3 delete error:', error);
      throw error;
    }
  }

  /**
   * Invalidate CloudFront cache for specific paths
   * @param paths - Array of paths to invalidate
   */
  static async invalidateCloudFront(paths: string[]): Promise<void> {
    if (!CLOUDFRONT_DISTRIBUTION_ID) {
      console.warn('CloudFront distribution ID not configured');
      return;
    }

    try {
      const command = new CreateInvalidationCommand({
        DistributionId: CLOUDFRONT_DISTRIBUTION_ID,
        InvalidationBatch: {
          Paths: {
            Quantity: paths.length,
            Items: paths,
          },
          CallerReference: `${Date.now()}`,
        },
      });

      await cloudFrontClient.send(command);
      console.log(`CloudFront invalidation created for ${paths.length} paths`);
    } catch (error) {
      console.error('CloudFront invalidation error:', error);
      // Don't throw - cache invalidation is nice to have but not critical
    }
  }

  /**
   * Get signed URL for uploading directly from client
   * @param key - S3 object key
   * @param expiresIn - URL expiration in seconds
   * @returns Signed URL
   */
  static async getUploadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!S3_BUCKET) {
      throw new Error('S3_BUCKET_NAME environment variable not set');
    }

    try {
      const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error('Signed URL error:', error);
      throw error;
    }
  }

  /**
   * List files in S3 bucket
   * @param prefix - Optional prefix to filter files
   */
  static async listFiles(prefix?: string): Promise<string[]> {
    if (!S3_BUCKET) {
      throw new Error('S3_BUCKET_NAME environment variable not set');
    }

    try {
      const command = new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        Prefix: prefix,
      });

      const response = await s3Client.send(command);
      return (
        response.Contents?.map((obj) => `https://${CLOUDFRONT_DOMAIN}/${obj.Key}`) || []
      );
    } catch (error) {
      console.error('S3 list error:', error);
      throw error;
    }
  }
}

export default S3Service;
