// Spike only. Runs as a module after the page has defined window.drawArea.
const { report, mark } = window.diag;
const STANDALONE_AREA = {
  type: "Polygon",
  coordinates: [[[-78.0899, -1.5799], [-77.9101, -1.5799], [-77.9101, -1.4001],
    [-78.0899, -1.4001], [-78.0899, -1.5799]]],
};

let app = null;
let sent = false;
async function send() {
  if (sent || !app) return;
  sent = true;
  try {
    await app.callServerTool({ name: "report_map_diagnostics", arguments: { report } });
    mark("report_sent");
  } catch (e) {
    mark("report_failed", { message: String(e) });
  }
}
window.diag.done = () => setTimeout(send, 1500);
setTimeout(send, 70000);

try {
  const { App } = await import("https://cdn.jsdelivr.net/npm/@modelcontextprotocol/ext-apps@2.0.0/dist/src/app-with-deps.js");
  mark("bridge_loaded");
  app = new App({ name: "amazonia360-map-spike", version: "0.0.1" });
  window.app = app;
  app.ontoolinput = (params) => {
    mark("tool_input");
    window.drawArea(params.arguments.area, params.arguments.indicator_id);
  };
  app.ontoolresult = (result) => window.onResult?.(result);
  const connected = app.connect().then(() => "host");
  const timeout = new Promise((r) => setTimeout(() => r("none"), 3000));
  const host = await Promise.race([connected, timeout]);
  mark(host === "host" ? "host_connected" : "no_host");
  if (host === "host") report.host = app.getHostVersion?.() ?? null;
  else window.drawArea(STANDALONE_AREA);
} catch (e) {
  mark("bridge_failed", { message: String(e) });
  window.drawArea(STANDALONE_AREA);
}
