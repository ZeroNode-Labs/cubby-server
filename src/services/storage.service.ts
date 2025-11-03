import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";

class StorageService {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION || "us-east-1";
    const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

    this.s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      forcePathStyle, // Required for MinIO
    });

    this.bucket = process.env.S3_BUCKET || "cubby-files";
  }

  /**
   * Initialize storage - create bucket if it doesn't exist
   */
  async initialize() {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      console.log(`✅ S3 bucket "${this.bucket}" already exists`);
    } catch (error: any) {
      if (
        error.name === "NotFound" ||
        error.$metadata?.httpStatusCode === 404
      ) {
        console.log(`📦 Creating S3 bucket "${this.bucket}"...`);
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.bucket })
        );
        console.log(`✅ S3 bucket "${this.bucket}" created successfully`);
      } else {
        console.error("❌ Error checking/creating bucket:", error);
        throw error;
      }
    }
  }

  /**
   * Upload a file to S3
   */
  async uploadFile(
    key: string,
    file: Buffer | Readable,
    metadata: {
      contentType: string;
      size: number;
      userId: string;
      originalName: string;
    }
  ): Promise<{ key: string; bucket: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: metadata.contentType,
      Metadata: {
        userId: metadata.userId,
        originalName: metadata.originalName,
        uploadedAt: new Date().toISOString(),
      },
    });

    await this.s3Client.send(command);

    return {
      key,
      bucket: this.bucket,
    };
  }

  /**
   * Download a file from S3
   */
  async downloadFile(key: string): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);

    if (!response.Body) {
      throw new Error("File not found in storage");
    }

    return response.Body as Readable;
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Get file metadata from S3
   */
  async getFileMetadata(key: string) {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);

    return {
      size: response.ContentLength,
      contentType: response.ContentType,
      lastModified: response.LastModified,
      metadata: response.Metadata,
    };
  }

  /**
   * Generate a unique S3 key for a file
   */
  generateKey(userId: string, filename: string): string {
    const timestamp = Date.now();
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `users/${userId}/${timestamp}-${sanitized}`;
  }
}

// Singleton instance
export const storageService = new StorageService();
