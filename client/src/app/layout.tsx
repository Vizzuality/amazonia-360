import type { Metadata } from "next";

import { Montserrat } from "next/font/google";

import "@/styles/globals.css";
import "@arcgis/core/assets/esri/themes/light/main.css";
import LayoutProviders from "@/app/layout-providers";

const montserrat = Montserrat({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutProviders>
      <html lang="en">
        <body className={montserrat.className}>{children}</body>
      </html>
    </LayoutProviders>
  );
}
