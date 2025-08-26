import { MapContainerProvider } from "@/components/map/container-provider";

export default function PageProviders({ children }: { children: React.ReactNode }) {
  return <MapContainerProvider>{children}</MapContainerProvider>;
}
