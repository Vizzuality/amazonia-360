"use client";

import { useIsMounted } from "usehooks-ts";

export const Mounted = ({
  children,
  loader,
}: {
  children: React.ReactNode;
  loader: React.ReactNode;
}) => {
  const isMounted = useIsMounted();

  console.log("isMounted:", isMounted());

  if (!isMounted()) {
    return <>{loader}</>;
  }

  return <>{children}</>;
};
