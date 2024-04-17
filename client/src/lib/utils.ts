import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getKeys = Object.keys as <T extends object>(
  obj: T,
) => Array<keyof T>;

export function getContrastColor(hexColor: string): number {
  // Convert hex color to RGB
  const r: number = parseInt(hexColor.substring(1, 3), 16);
  const g: number = parseInt(hexColor.substring(3, 5), 16);
  const b: number = parseInt(hexColor.substring(5, 7), 16);

  // Calculate luminance (brightness) of the color
  const luminance: number = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black or white depending on luminance
  return luminance;
}

export function joinWithAnd(arr: string[]) {
  if (arr.length === 0) return "";
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return arr.join(" and ");

  const lastItem = arr.pop();
  return arr.join(", ") + " and " + lastItem;
}
