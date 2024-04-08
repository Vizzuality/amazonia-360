"use client";

import { Card, CardTitle } from "@/containers/card";
import WidgetLandmarksCities from "@/containers/widgets/overview/landmarks/cities";
import WidgetLandmarksCountries from "@/containers/widgets/overview/landmarks/countries";
import WidgetLandmarksNatural from "@/containers/widgets/overview/landmarks/natural_landmarks";

export default function WidgetLandmarks() {
  return (
    <Card>
      <CardTitle>Landmarks</CardTitle>
      <WidgetLandmarksCities />
      <WidgetLandmarksNatural />
      <WidgetLandmarksCountries />
    </Card>
  );
}
