// Dev SSR imports external CJS through Node, where the default import of an `__esModule`
// package is its whole `module.exports`; the browser bundle unwraps it to `exports.default`.
// https://nodejs.org/api/esm.html#commonjs-namespaces
export function getCjsDefault<T>(value: T): T {
  return (value as { default?: T }).default ?? value;
}
