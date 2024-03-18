import type { Metadata } from "next";

import LayoutProviders from "@/app/report/layout-providers";

export const metadata: Metadata = {
  title: "Report | create",
  description: "Report description",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <LayoutProviders>{children}</LayoutProviders>;
}
