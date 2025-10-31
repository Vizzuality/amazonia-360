import { auth } from "@/lib/auth";

import MyAreaMe from "@/containers/my-area/me";

export default async function MyAreaPage() {
  const session = await auth();

  return (
    <main className="relative top-16 flex min-h-[calc(100svh_-_theme(space.40)_+_1px)] flex-col">
      <div className="container">
        <h1 className="mb-8 mt-4 text-3xl font-semibold">My Area</h1>
        <pre>{JSON.stringify({ session }, null, 2)}</pre>

        <MyAreaMe />
      </div>
    </main>
  );
}
