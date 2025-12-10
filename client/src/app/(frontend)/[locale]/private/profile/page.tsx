import { Profile } from "@/containers/private/profile";

export const dynamic = "force-dynamic";

export default async function MyProfilePage() {
  return (
    <main className="relative flex min-h-[calc(100svh_-_theme(space.16))] flex-col bg-muted">
      <div className="container space-y-5">
        <Profile />
      </div>
    </main>
  );
}
