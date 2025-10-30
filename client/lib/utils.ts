import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize common remote image sharing URLs to direct image URLs.
 * - Google Drive: convert /file/d/:id/view to /uc?export=view&id=:id
 * - Dropbox: convert dl=0 -> dl=1
 */
export function normalizeImageUrl(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  try {
    // Google Drive /file/d/:id/view or /open?id=:id
    const driveMatch = trimmed.match(/https?:\/\/(?:drive\.google\.com)\/(?:file\/d\/([a-zA-Z0-9_-]+)\/view|open\?id=([a-zA-Z0-9_-]+))/i);
    if (driveMatch) {
      const id = driveMatch[1] || driveMatch[2];
      if (id) return `https://drive.google.com/uc?export=view&id=${id}`;
    }

    // Dropbox share links: dl=0 -> dl=1 for direct
    if (/dropbox\.com\//i.test(trimmed)) {
      if (trimmed.includes("dl=0")) return trimmed.replace("dl=0", "dl=1");
      if (!trimmed.includes("dl=")) return trimmed + "?dl=1";
    }

    return trimmed;
  } catch (e) {
    return trimmed;
  }
}
