// This file is for server-side utility functions that can be shared across Cloud Functions.

export function slugifyName(name: string): string {
  if (!name) return '';
  return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
}

export function formatTagNumber(n: number | undefined): string {
  if (n === undefined || isNaN(n) || n < 1) return '000';
  if (n < 1000) {
    return n.toString().padStart(3, "0");
  }
  return n.toString();
}
