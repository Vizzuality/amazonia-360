/**
 * Generated by orval v6.31.0 🍺
 * Do not edit manually.
 * Amazonia360 API
 * OpenAPI spec version: 0.1.0
 */
import { API } from "../../services/api";

type SecondParameter<T extends (...args: any) => any> = Parameters<T>[1];

/**
 * Health check.
 * @summary Health
 */
export const healthHealthGet = (options?: SecondParameter<typeof API>) => {
  return API<unknown>({ url: `/health`, method: "GET" }, options);
};
