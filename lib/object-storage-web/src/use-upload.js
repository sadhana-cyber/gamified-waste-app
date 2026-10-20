import { useState, useCallback } from "react";
function useUpload(options = {}) {
  const basePath = options.basePath ?? "/api/storage";
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const requestUploadUrl = useCallback(
    async (file) => {
      const response = await fetch(`${basePath}/uploads/request-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream"
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get upload URL");
      }
      return response.json();
    },
    []
  );
  const uploadToPresignedUrl = useCallback(
    async (file, uploadURL) => {
      const response = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream"
        }
      });
      if (!response.ok) {
        throw new Error("Failed to upload file to storage");
      }
    },
    []
  );
  const uploadFile = useCallback(
    async (file) => {
      setIsUploading(true);
      setError(null);
      setProgress(0);
      try {
        setProgress(10);
        const uploadResponse = await requestUploadUrl(file);
        setProgress(30);
        await uploadToPresignedUrl(file, uploadResponse.uploadURL);
        setProgress(100);
        options.onSuccess?.(uploadResponse);
        return uploadResponse;
      } catch (err) {
        const error2 = err instanceof Error ? err : new Error("Upload failed");
        setError(error2);
        options.onError?.(error2);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [requestUploadUrl, uploadToPresignedUrl, options]
  );
  const getUploadParameters = useCallback(
    async (file) => {
      const response = await fetch(`${basePath}/uploads/request-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream"
        })
      });
      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }
      const data = await response.json();
      return {
        method: "PUT",
        url: data.uploadURL,
        headers: { "Content-Type": file.type || "application/octet-stream" }
      };
    },
    []
  );
  return {
    uploadFile,
    getUploadParameters,
    isUploading,
    error,
    progress
  };
}
export {
  useUpload
};
