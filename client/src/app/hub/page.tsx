import { Metadata } from "next";

import PageProviders from "@/app/report/page-providers";

import Footer from "@/containers/footer";
import Hub from "@/containers/hub";

export const metadata: Metadata = {
  title: "Hub",
  description: "Coming soon...",
};

export default function HubPage() {
  return (
    <PageProviders>
      <Hub />
      <Footer />
    </PageProviders>
  );
}
