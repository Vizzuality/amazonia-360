// Spike only: records what the host sandbox allows, before any library loads, so a
// blocked script still leaves a report on screen and, if the bridge loads, on disk.
window.diag = (() => {
  const t0 = performance.now();
  const report = {
    library: document.documentElement.dataset.library,
    origin: location.origin,
    user_agent: navigator.userAgent,
    webgl2: !!document.createElement("canvas").getContext("webgl2"),
    policy: null,
    violations: [],
    errors: [],
    events: [],
  };
  const panel = () => document.getElementById("diag");
  const render = () => {
    const el = panel();
    if (!el) return;
    const last = report.events.at(-1);
    el.textContent = [
      `${report.library} · ${last ? `${last.name} at ${last.ms} ms` : "starting"}`,
      ...report.violations.slice(0, 4).map((v) => `CSP ${v.directive}: ${v.blocked}`),
      ...report.errors.slice(0, 3).map((e) => `error: ${e}`),
    ].join("\n");
  };
  const mark = (name, extra = {}) => {
    report.events.push({ name, ms: Math.round(performance.now() - t0), ...extra });
    render();
  };
  document.addEventListener("securitypolicyviolation", (e) => {
    report.policy ??= e.originalPolicy;
    report.violations.push({ directive: e.effectiveDirective, blocked: e.blockedURI });
    render();
  });
  addEventListener("error", (e) => {
    report.errors.push(String(e.message || e.target?.src || e));
    render();
  }, true);
  addEventListener("unhandledrejection", (e) => {
    report.errors.push(String(e.reason?.message || e.reason));
    render();
  });

  // Probes: whether a blob worker runs, and a deliberately undeclared image so a
  // violation, and with it the host's policy, is recorded even if nothing else fails.
  try {
    const url = URL.createObjectURL(new Blob(["postMessage(1)"], { type: "text/javascript" }));
    const w = new Worker(url);
    w.onmessage = () => mark("probe_blob_worker_ok");
    w.onerror = () => mark("probe_blob_worker_failed");
  } catch (e) {
    mark("probe_blob_worker_threw", { message: String(e) });
  }
  addEventListener("DOMContentLoaded", () => {
    const img = new Image();
    img.src = "https://example.com/csp-probe.png";
    render();
  });

  return { report, mark };
})();
