import { useEffect } from "react";

export type GoogleTagManagerProps = {
  gtmId: string;
  dataLayerName?: string;
};

function appendScript(id: string, configure: (script: HTMLScriptElement) => void) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  configure(script);
  document.body.appendChild(script);
}

export function GoogleTagManager({ gtmId, dataLayerName = "dataLayer" }: GoogleTagManagerProps) {
  useEffect(() => {
    const scriptUrl = new URL("https://www.googletagmanager.com/gtm.js");
    scriptUrl.searchParams.set("id", gtmId);
    if (dataLayerName !== "dataLayer") scriptUrl.searchParams.set("l", dataLayerName);

    appendScript("_next-gtm-init", (script) => {
      script.textContent = `
      (function(w,l){
        w[l]=w[l]||[];
        w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
      })(window,'${dataLayerName}');`;
    });
    appendScript("_next-gtm", (script) => {
      script.src = scriptUrl.href;
      script.dataset.ntpc = "GTM";
    });
  }, [gtmId, dataLayerName]);

  return null;
}
