import Disclaimer from "@/containers/disclaimers";

export default function DataDisclaimer() {
  return (
    <Disclaimer className="py-10">
      <div className="container">
        <div className="space-y-2">
          <p className="text-sm font-medium">
            The maps, data, and geographic information presented on AmazoniaForever360+ are provided
            for reference purposes only and are intended solely to enhance territorial knowledge of
            the Amazonia Forever program&apos;s work area.
          </p>

          <p className="text-sm font-medium">
            International boundary lines and other administrative delimitations used by
            AmazoniaForever360+ are sourced from carefully selected and well-referenced external
            sources. However, the original data may have been modified to meet cartographic
            visualization requirements. The cartographic material presented does not reflect any
            position held by the Inter-American Development Bank (IDB) regarding international
            borders, disputes, or claims between countries.
          </p>

          <p className="text-sm font-medium">
            This material is not suitable for precision applications, navigation, or emergency
            situations. AmazoniaForever360+ and its affiliates, including the Inter-American
            Development Bank (IDB), shall not be held liable for any damages, losses, or claims
            arising from the use of or reliance on the information provided.
          </p>
        </div>
      </div>
    </Disclaimer>
  );
}
