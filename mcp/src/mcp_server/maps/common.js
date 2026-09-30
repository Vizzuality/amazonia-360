// Shared by the map pages; runs before them as a classic script.
window.map360 = (() => {
  const SUPPORTED = ["en", "es"];
  const MAPLIBRE = "https://cdn.jsdelivr.net/npm/maplibre-gl@6.11.2/dist/maplibre-gl.mjs";
  const BASEMAP = "https://tiles.openfreemap.org/styles/positron";
  // The texts every page shows.
  const SHARED = {
    en: {
      waiting: "Waiting for the figures…",
      failed: "The map could not load: {message}",
      outside: "{ha} ha of the area are outside the module. Its outline was derived from one of its layers, to about 50 m, until the official one arrives.",
    },
    es: {
      waiting: "Esperando las cifras…",
      failed: "No se pudo cargar el mapa: {message}",
      outside: "{ha} ha del área quedan fuera del módulo. Su contorno se obtuvo de una de sus capas, con unos 50 m de precisión, hasta que llegue el oficial.",
    },
  };
  // The host's locale when it gives one, the browser's otherwise.
  const locale = () => window.app?.getHostContext?.()?.locale || navigator.language || "en";
  const language = () => {
    const code = locale().slice(0, 2).toLowerCase();
    return SUPPORTED.includes(code) ? code : "en";
  };
  const translator = (messages) => {
    const texts = Object.fromEntries(SUPPORTED.map((l) => [l, { ...SHARED[l], ...messages[l] }]));
    return (key, vars = {}) => {
      const text = texts[language()][key] ?? texts.en[key] ?? key;
      return text.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "");
    };
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const errorMessage = (e) => String(e?.message || e);
  const number = (n, options = {}) => new Intl.NumberFormat(locale(), options).format(n);
  // A class that is present never reads as 0.
  const ha = (n) => (n > 0 && n < 0.5 ? `< ${number(1)}` : number(n, { maximumFractionDigits: 0 }));
  const pct = (n) => {
    const options = { style: "percent", maximumFractionDigits: 1 };
    return n > 0 && n < 0.0005 ? `< ${number(0.001, options)}` : number(n, options);
  };
  const swatch = (background) => `<span class="swatch" style="background:${esc(background || "hsl(var(--muted))")}"></span>`;
  const ringSwatch = (color, width) =>
    `<span class="swatch" style="background:none;box-shadow:inset 0 0 0 ${Number(width) || 0}px ${esc(color)}"></span>`;
  const notesHtml = (notes) => notes.map((n) => `<p class="note">${esc(n)}</p>`).join("");
  const outerRings = (area) =>
    area.type === "Polygon" ? [area.coordinates[0]] : area.coordinates.map((p) => p[0]);
  const bounds = (area) => {
    const points = outerRings(area).flat();
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    return [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]];
  };
  // Fetched from the moment the page loads, so it is ready when the area arrives.
  const library = import(MAPLIBRE);
  const createMap = async (area, padding) => {
    const maplibregl = await library;
    const map = new maplibregl.Map({
      container: "map",
      style: BASEMAP,
      bounds: bounds(area),
      fitBoundsOptions: { padding },
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    return { maplibregl, map };
  };
  // With a place_id the input has no geometry; the result then carries the area. Either
  // may arrive first, and the map is drawn by whichever brings it.
  const drawOnce = (draw) => {
    let started = false;
    return (area) => {
      if (started || !area) return;
      started = true;
      draw(area).catch((e) => window.view.fail(errorMessage(e)));
    };
  };
  return {
    translator, esc, errorMessage, number, ha, pct, swatch, ringSwatch, notesHtml,
    bounds, outerRings, createMap, drawOnce,
  };
})();
