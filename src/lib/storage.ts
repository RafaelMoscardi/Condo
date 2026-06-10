import { put, del } from "@vercel/blob";
import fs from "fs";
import path from "path";

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

export async function uploadFile(buffer: Buffer, filename: string, folder: string): Promise<string> {
  if (useBlob) {
    const { url } = await put(`${folder}/${filename}`, buffer, { access: "public" });
    return url;
  }
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(path.join(uploadDir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
}

export async function deleteFile(url: string): Promise<void> {
  try {
    if (useBlob && url.startsWith("https://")) {
      await del(url);
    } else if (url.startsWith("/uploads/")) {
      fs.unlinkSync(path.join(process.cwd(), "public", url));
    }
  } catch {}
}
