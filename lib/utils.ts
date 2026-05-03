import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Escapes special regex characters in a string so it can be used in a RegExp. */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Converts a title into a URL-friendly slug (lowercase, hyphenated). */
export function generateSlug(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Recursively serializes data returned from Mongoose `.lean()` calls,
 * converting ObjectIds and Dates to plain strings so they can be safely
 * passed across the server/client boundary.
 */
export function serializeData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}
