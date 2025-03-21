import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { IndicatorView } from "@/app/parsers";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getKeys = Object.keys as <T extends object>(obj: T) => Array<keyof T>;

export function joinWithAnd(arr: string[]) {
  if (arr.length === 0) return "";
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return arr.join(" and ");

  const lastItem = arr.pop();
  return arr.join(", ") + " and " + lastItem;
}

export function convertHexToRgbaArray(hex: string, opacity: number = 1): number[] {
  const hexValue = hex.replace(/^#/, "");
  const red = parseInt(hexValue.substring(0, 2), 16);
  const green = parseInt(hexValue.substring(2, 4), 16);
  const blue = parseInt(hexValue.substring(4, 6), 16);
  const alpha = opacity * 255;
  return [red, green, blue, alpha];
}

export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const omitKeys = new Set(keys as string[]);
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !omitKeys.has(k))) as Omit<T, K>;
}

export const getTextSize = ({
  text,
  maxWidth,
  padding = 0,
  font,
}: {
  text: string;
  maxWidth: number;
  padding?: number;
  font?: string;
}): {
  width: number;
  height: number;
} => {
  if (typeof window === "undefined") {
    return {
      width: 0,
      height: 0,
    };
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (context && text) {
    context.font = font || getComputedStyle(document.body).font;

    const words = text.split(" ");
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = context.measureText(currentLine + " " + word).width;
      if (width < maxWidth - padding * 2) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);

    const lineHeight = context.measureText("M").width; // Approximate line height
    const totalHeight = lines.length * lineHeight;
    const longestLine = lines.reduce((a, b) => (a.length > b.length ? a : b));
    const totalWidth = context.measureText(longestLine).width;

    canvas.remove();

    return { width: totalWidth, height: totalHeight };
  }

  canvas.remove();

  return {
    width: 0,
    height: 0,
  };
};

export function areArraysEqual(
  arr1: IndicatorView[] | undefined,
  arr2: IndicatorView[] | undefined,
) {
  if (arr1?.length !== arr2?.length || !arr1?.length || !arr2?.length) return false;

  const normalize = (obj: IndicatorView): string => JSON.stringify(Object.entries(obj).sort());

  const sortedArr1 = arr1.map(normalize).sort();
  const sortedArr2 = arr2.map(normalize).sort();

  return JSON.stringify(sortedArr1) === JSON.stringify(sortedArr2);
}
