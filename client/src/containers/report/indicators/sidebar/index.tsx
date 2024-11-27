"use client";

import dynamic from "next/dynamic";

const TopicsSidebar = dynamic(
  () => import("@/containers/report/indicators/sidebar/sidebar-content"),
  {
    ssr: false,
  },
);

export default function TopicsSidebarContainer() {
  return (
    <div className="relative">
      <TopicsSidebar />
    </div>
  );
}
