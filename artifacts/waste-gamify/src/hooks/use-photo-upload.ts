import { useState, useCallback } from "react";

interface UploadResult {
  objectPath: string;
  previewUrl: string;
}

interface UsePhotoUploadOptions {
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: string) => void;
}

export function usePhotoUpload(options?: UsePhotoUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedPhoto, setUploadedPhoto] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      const msg = "Please select an image file";
      setError(msg);
      options?.onError?.(msg);
      return null;
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Step 1: request presigned URL from our server
      const metaRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type,
        }),
      });

      if (!metaRes.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await metaRes.json();

      setProgress(30);

      // Step 2: upload directly to GCS via presigned URL
      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      setProgress(100);

      const result: UploadResult = {
        objectPath,
        previewUrl: URL.createObjectURL(file),
      };

      setUploadedPhoto(result);
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
      options?.onError?.(msg);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [options]);

  const clearPhoto = useCallback(() => {
    setUploadedPhoto(null);
    setError(null);
    setProgress(0);
  }, []);

  return { uploadFile, isUploading, progress, uploadedPhoto, error, clearPhoto };
}
