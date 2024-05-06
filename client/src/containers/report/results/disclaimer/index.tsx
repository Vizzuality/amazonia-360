import { Card } from "@/containers/card";

export default function ReportResultsDisclaimer() {
  return (
    <div className="container print:hidden mb-10">
      <Card className="space-y-2">
        <p className="italic">
          The maps, data, and geographic information presented on Amazonia360
          are provided for reference purposes only and are intended solely to
          enhance territorial knowledge of the Amazonia Forever program&apos;s
          work area.
        </p>

        <p className="italic text-sm">
          International boundary lines and other administrative delimitations
          used by Amazonia360 are sourced from carefully selected and
          well-referenced external sources. However, the original data may have
          been modified to meet cartographic visualization requirements. The
          cartographic material presented does not reflect any position held by
          the Inter-American Development Bank (IDB) regarding international
          borders, disputes, or claims between countries.
        </p>

        <p className="italic text-sm">
          This material is not suitable for precision applications, navigation,
          or emergency situations. Amazonia360 and its affiliates, including the
          Inter-American Development Bank (IDB), shall not be held liable for
          any damages, losses, or claims arising from the use of or reliance on
          the information provided.
        </p>
      </Card>
    </div>
  );
}
