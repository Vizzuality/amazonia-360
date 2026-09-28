// Shared by the map pages; runs before them as a classic script.
window.map360 = (() => {
  const SUPPORTED = ["en", "es"];
  // The host's locale when it gives one, the browser's otherwise.
  const locale = () => window.app?.getHostContext?.()?.locale || navigator.language || "en";
  const language = () => {
    const code = locale().slice(0, 2).toLowerCase();
    return SUPPORTED.includes(code) ? code : "en";
  };
  const translator = (messages) => (key, vars = {}) => {
    const text = messages[language()]?.[key] ?? messages.en[key] ?? key;
    return text.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "");
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const number = (n, options = {}) => new Intl.NumberFormat(locale(), options).format(n);
  const outerRings = (area) =>
    area.type === "Polygon" ? [area.coordinates[0]] : area.coordinates.map((p) => p[0]);
  const bounds = (area) => {
    const points = outerRings(area).flat();
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    return [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]];
  };
  return { translator, esc, number, bounds, outerRings };
})();
