import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getKeys = Object.keys as <T extends object>(
  obj: T,
) => Array<keyof T>;
