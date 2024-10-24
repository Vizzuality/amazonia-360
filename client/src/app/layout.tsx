import type { Metadata } from "next";

import { Montserrat } from "next/font/google";
import { cookies } from "next/headers";

import "@arcgis/core/assets/esri/themes/light/main.css";
import "@/styles/globals.css";

import LayoutProviders from "@/app/layout-providers";

import DemoDisclaimer from "@/containers/disclaimers/demo";
import Footer from "@/containers/footer";
import Header from "@/containers/header";

const montserrat = Montserrat({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--montserrat",
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookiesStore = await cookies();
  const session = cookiesStore.get("session");
  const sessionExpire = cookiesStore.get("session_expire");

  return (
    <LayoutProviders
      session={{
        token: atob(session?.value || ""),
        expire: +(sessionExpire?.value || 0),
      }}
    >
      <html lang="en">
        <body className={montserrat.className}>
          <DemoDisclaimer />
          <Header />
          {children}
          <Footer />
        </body>
      </html>
    </LayoutProviders>
  );
}
