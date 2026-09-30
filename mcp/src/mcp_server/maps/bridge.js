// Connects the page to the host. Runs after the page has defined window.view.
try {
  const { App } = await import("https://cdn.jsdelivr.net/npm/@modelcontextprotocol/ext-apps@2.0.0/dist/src/app-with-deps.js");
  const app = new App({ name: "amazonia360-map", version: "1.0.0" });
  window.app = app;
  app.ontoolinput = (params) => window.view.input(params.arguments ?? {});
  app.ontoolresult = (result) => window.view.result(result);
  await app.connect();
} catch (e) {
  window.view.fail(window.map360.errorMessage(e));
}
