"use client";

import { Card, CardTitle, CardWidgetNumber } from "@/containers/card";

export default function WidgetForestFires() {
  return (
    <Card>
      <CardTitle>Frequency of forest fires</CardTitle>
      {/* <CardLoader
        query={[queryIndigenousLands, queryIndigenousLandsCoverage]}
        className="h-12"
      >
        <ArcChart value={queryIndigenousLandsCoverage.data?.percentage ?? 0} />
      </CardLoader> */}

      <CardWidgetNumber
        value={"Low"}
        subvalue="based on an estimate of fire points"
      />
    </Card>
  );
}
