import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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

export function makePublicTag(name: string, n: number): string {
  return `${slugifyName(name)}#${formatTagNumber(n)}`;
}
