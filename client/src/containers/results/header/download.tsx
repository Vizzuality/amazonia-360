"use client";

import {
  // useMemo,
  useState,
} from "react";

// import { usePathname, useSearchParams } from "next/navigation";

// import { useAtomValue } from "jotai";
import { Download } from "lucide-react";

// import { generatedAITextAtom } from "@/app/store";
import {
  // GeoJSONPolygon,
  filenameFromCD,
  downloadBlobResponse,
} from "@/lib/pdf";

import { Button } from "@/components/ui/button";

// type PDFPayload = {
//   pagePath: string;
//   geometry?: GeoJSONPolygon;
//   generatedTextContent?: object;
// };

export default function ReportButton() {
  const [status, setStatus] = useState<"idle" | "pending">("idle");
  // const generatedTextContent = useAtomValue(generatedAITextAtom);
  // const pathname = usePathname();
  // const URLparams = useSearchParams()?.toString();
  // const bbox = useSearchParams()?.get("?bbox") ?? undefined;
  // const isAIEnabled = useSearchParams()?.get("aiSummary") ?? undefined;

  // const geometry = useMemo(() => {
  //   if (!bbox) return undefined;
  //   try {
  //     const bboxParsed = parseBBox(bbox);
  //     return bboxToGeoJSONPolygon(bboxParsed);
  //   } catch {
  //     return undefined;
  //   }
  // }, [bbox]);

  // const pagePath = useMemo(() => `${pathname}?${URLparams}`, [pathname, URLparams]);

  const handleClick = async () => {
    // const payload: PDFPayload = { pagePath };
    // if (geometry) payload.geometry = geometry;
    // if (isAIEnabled) payload.generatedTextContent = generatedTextContent;
    const fakePayload = {
      pagePath:
        '/en/report/results?%3Fbbox=-9179719.906994147,-723616.366654413,-7381921.00172728,109241.49354064604&topics={"id":1,"indicators":[{"id":26,"type":"numeric","x":3,"y":0,"w":1,"h":1},{"id":26,"type":"map","x":2,"y":3,"w":2,"h":4},{"id":10,"type":"chart","x":2,"y":1,"w":2,"h":2},{"id":13,"type":"numeric","x":0,"y":0,"w":1,"h":1},{"id":25,"type":"numeric","x":2,"y":0,"w":1,"h":1},{"id":12,"type":"numeric","x":1,"y":0,"w":1,"h":1},{"id":29,"type":"map","x":0,"y":5,"w":2,"h":4},{"id":24,"type":"chart","x":0,"y":1,"w":2,"h":2}]},{"id":4,"indicators":[{"id":72,"type":"map","x":0,"y":0,"w":2,"h":4},{"id":58,"type":"map","x":2,"y":0,"w":2,"h":4}]}&location={"type":"polygon","geometry":{"spatialReference":{"wkid":102100},"rings":[[[-8280820.454360714,-260331.5382180824],[-7778132.337843387,19848.38896115661],[-7925655.802433738,-634223.2620749235],[-8280820.454360714,-260331.5382180824]]]},"buffer":0}&gridFiltersSetUp={"limit":10,"opacity":100,"direction":"desc"}',
    };
    setStatus("pending");
    try {
      const res = await fetch("/local-api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fakePayload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return new Response(
          JSON.stringify({
            error: err.message || err.error || `Error ${res.status}`,
          }),
          {
            status: res.status,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const filename = filenameFromCD(res.headers.get("Content-Disposition"));

      await downloadBlobResponse(res, filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      return new Response(JSON.stringify({ error: "Failed to generate PDF" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    } finally {
      setStatus("idle");
    }
  };

  return (
    <Button
      variant="outline"
      className="space-x-2"
      onClick={handleClick}
      disabled={status === "pending"}
    >
      {status === "pending" ? <span>Generating PDF...</span> : <Download className="h-5 w-5" />}
    </Button>
  );
}
