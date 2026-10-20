import { Router } from "express";
import express from "express";
import { Readable } from "stream";
import fs from "fs";
import path from "path";
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse
} from "@workspace/api-zod";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
const router = Router();
const objectStorageService = new ObjectStorageService();
const LOCAL_UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
router.post("/storage/uploads/request-url", async (req, res) => {
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }
  try {
    const { name, size, contentType } = parsed.data;
    const uploadURL = await objectStorageService.getObjectEntityUploadURL({ name, contentType });
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
    res.json(
      RequestUploadUrlResponse.parse({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType }
      })
    );
  } catch (error) {
    req.log.error({ err: error }, "Error generating upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});
router.put(
  "/storage/uploads/local",
  express.raw({ type: "*/*", limit: "50mb" }),
  async (req, res) => {
    try {
      const fileId = req.query.file;
      if (!fileId) {
        res.status(400).json({ error: "Missing file parameter" });
        return;
      }
      if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
        fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
      }
      const filePath = path.join(LOCAL_UPLOADS_DIR, path.basename(fileId));
      await fs.promises.writeFile(filePath, req.body);
      const contentType = req.query.type || req.headers["content-type"];
      if (contentType) {
        await fs.promises.writeFile(`${filePath}.meta`, JSON.stringify({ contentType }));
      }
      res.status(200).json({ success: true, file: fileId });
    } catch (error) {
      req.log.error({ err: error }, "Error saving local upload");
      res.status(500).json({ error: "Failed to save uploaded file" });
    }
  }
);
router.get("/storage/public-objects/*filePath", async (req, res) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    const localFile = path.join(LOCAL_UPLOADS_DIR, path.basename(filePath));
    if (fs.existsSync(localFile)) {
      res.sendFile(localFile);
      return;
    }
    const file = await objectStorageService.searchPublicObject(filePath);
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }
    const response = await objectStorageService.downloadObject(file);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    req.log.error({ err: error }, "Error serving public object");
    res.status(500).json({ error: "Failed to serve public object" });
  }
});
router.get("/storage/objects/*path", async (req, res) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
    const cleanFileName = path.basename(wildcardPath);
    const localFile = path.join(LOCAL_UPLOADS_DIR, cleanFileName);
    if (fs.existsSync(localFile)) {
      const metaPath = `${localFile}.meta`;
      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
          if (meta.contentType) {
            res.setHeader("Content-Type", meta.contentType);
          }
        } catch {
        }
      }
      res.sendFile(localFile);
      return;
    }
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
    const response = await objectStorageService.downloadObject(objectFile);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, "Object not found");
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});
var stdin_default = router;
export {
  stdin_default as default
};
