import { createFileRoute } from "@tanstack/react-router";

import { Profile } from "@/containers/private/profile";

export const Route = createFileRoute("/$locale/{-$country}/private/profile")({
  component: MyProfilePage,
});

function MyProfilePage() {
  return (
    <main className="relative flex min-h-[calc(100svh-calc(var(--spacing)*16))] flex-col bg-muted">
      <div className="container space-y-5">
        <Profile />
      </div>
    </main>
  );
}
