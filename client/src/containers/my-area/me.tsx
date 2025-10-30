"use client";

import { useQuery } from "@tanstack/react-query";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

import { sdk } from "@/services/sdk";

export default function MyAreaMe() {
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: () =>
      sdk.me({
        collection: "users",
      }),
  });

  return (
    <div className="space-y-2">
      <Button onClick={() => signOut()}>Sign Out</Button>

      <div>
        <pre>{JSON.stringify({ data }, null, 2)}</pre>
      </div>
    </div>
  );
}
