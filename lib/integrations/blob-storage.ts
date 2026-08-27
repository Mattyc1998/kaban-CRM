import { put } from "@vercel/blob";

export class BlobNotConfiguredError extends Error {
  constructor() {
    super(
      "BLOB_READ_WRITE_TOKEN is not set — file uploads aren't configured yet."
    );
    this.name = "BlobNotConfiguredError";
  }
}

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB

export async function uploadProjectFile(
  projectId: string,
  file: File
): Promise<{ url: string; name: string }> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new BlobNotConfiguredError();
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File is too large (25MB max).");
  }

  const blob = await put(`projects/${projectId}/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return { url: blob.url, name: file.name };
}
