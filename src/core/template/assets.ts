import fs from "./fs";

export interface Asset {
  filename: string;
  data: Blob;
}

export function isAsset(obj: unknown): obj is Asset {
  if (typeof obj !== "object" || !obj) return false;
  return "filename" in obj && "data" in obj;
}

const assetUrlCache = new Map<string, string>();

export const AssetURIHandler = {
  id: "asset",

  test(uri: string): boolean {
    return uri.startsWith("asset://");
  },

  transform(uri: string): string {
    const assetPath = uri.replace(/^asset:\/\//, "");
    if (assetUrlCache.has(assetPath)) {
      return assetUrlCache.get(assetPath)!;
    }
    const file = fs.readFile(assetPath);
    const objUrl = URL.createObjectURL(file);
    assetUrlCache.set(assetPath, objUrl);
    return objUrl;
  },

  stringify(data: unknown): string {
    if (typeof data === "string") {
      return `asset://${data}`;
    } else if (isAsset(data)) {
      return `asset://${data.filename}`;
    }
    throw new Error("Invalid data type");
  },
};
