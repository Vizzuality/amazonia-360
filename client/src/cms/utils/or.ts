import { Access } from "payload";

export const or =
  (...funcs: Access[]): Access =>
  (...params) =>
    funcs.some((func) => func(...params));
