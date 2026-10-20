import { Storage } from "@google-cloud/storage";
import { Readable } from "stream";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import {
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy
} from "./objectAcl";
const STORAGE_SIDECAR_ENDPOINT = process.env.STORAGE_SIDECAR_ENDPOINT;
const LOCAL_UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
const objectStorageClient = new Storage({
  credentials: STORAGE_SIDECAR_ENDPOINT ? {
    audience: "storage",
    subject_token_type: "access_token",
    token_url: `${STORAGE_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${STORAGE_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token"
      }
    },
    universe_domain: "googleapis.com"
  } : void 0,
  projectId: process.env.GCP_PROJECT_ID || ""
});
class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}
class ObjectStorageService {
  constructor() {
    if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
      try {
        fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
      } catch {
      }
    }
  }
  getPublicObjectSearchPaths() {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    return Array.from(
      new Set(
        pathsStr.split(",").map((p) => p.trim()).filter((p) => p.length > 0)
      )
    );
  }
  getPrivateObjectDir() {
    return process.env.PRIVATE_OBJECT_DIR || "";
  }
  async searchPublicObject(filePath) {
    const searchPaths = this.getPublicObjectSearchPaths();
    if (searchPaths.length === 0) return null;
    for (const searchPath of searchPaths) {
      const fullPath = `${searchPath}/${filePath}`;
      try {
        const { bucketName, objectName } = parseObjectPath(fullPath);
        const bucket = objectStorageClient.bucket(bucketName);
        const file = bucket.file(objectName);
        const [exists] = await file.exists();
        if (exists) return file;
      } catch {
        continue;
      }
    }
    return null;
  }
  async downloadObject(file, cacheTtlSec = 3600) {
    const [metadata] = await file.getMetadata();
    const aclPolicy = await getObjectAclPolicy(file);
    const isPublic = aclPolicy?.visibility === "public";
    const nodeStream = file.createReadStream();
    const webStream = Readable.toWeb(nodeStream);
    const headers = {
      "Content-Type": metadata.contentType || "application/octet-stream",
      "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`
    };
    if (metadata.size) {
      headers["Content-Length"] = String(metadata.size);
    }
    return new Response(webStream, { headers });
  }
  async getObjectEntityUploadURL(meta) {
    const objectId = randomUUID();
    if (STORAGE_SIDECAR_ENDPOINT && process.env.PRIVATE_OBJECT_DIR) {
      const privateObjectDir = this.getPrivateObjectDir();
      const fullPath = `${privateObjectDir}/uploads/${objectId}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      return signObjectURL({
        bucketName,
        objectName,
        method: "PUT",
        ttlSec: 900
      });
    }
    const query = new URLSearchParams({
      file: objectId,
      name: meta?.name || "upload",
      type: meta?.contentType || "application/octet-stream"
    });
    return `/api/storage/uploads/local?${query.toString()}`;
  }
  async getObjectEntityFile(objectPath) {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }
    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir) {
      throw new ObjectNotFoundError();
    }
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }
  normalizeObjectEntityPath(rawPath) {
    if (rawPath.includes("local?")) {
      try {
        const u = new URL(rawPath, "http://localhost");
        const fileId = u.searchParams.get("file");
        if (fileId) return `/objects/uploads/${fileId}`;
      } catch {
      }
    }
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir) return rawObjectPath;
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }
    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }
    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }
  async trySetObjectEntityAclPolicy(rawPath, aclPolicy) {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }
    try {
      const objectFile = await this.getObjectEntityFile(normalizedPath);
      await setObjectAclPolicy(objectFile, aclPolicy);
    } catch {
    }
    return normalizedPath;
  }
  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission
  }) {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ
    });
  }
}
function parseObjectPath(path2) {
  if (!path2.startsWith("/")) {
    path2 = `/${path2}`;
  }
  const pathParts = path2.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return {
    bucketName,
    objectName
  };
}
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec
}) {
  if (!REPLIT_SIDECAR_ENDPOINT) {
    throw new Error("REPLIT_SIDECAR_ENDPOINT not configured");
  }
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1e3).toISOString()
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(3e4)
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}`
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}
export {
  ObjectNotFoundError,
  ObjectStorageService,
  objectStorageClient
};
