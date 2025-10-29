import { headers as getHeaders } from "next/headers";

import { getPayload } from "payload";

import config from "@/payload.config";

export default async function HomePage() {
  const headers = await getHeaders();
  const payload = await getPayload({ config });
  const { permissions, user } = await payload.auth({ headers });

  // if (!user) {
  //   return null;
  // }

  return (
    <main className="relative top-16 flex min-h-[calc(100svh_-_theme(space.40)_+_1px)] flex-col">
      <div className="container">
        <h1 className="mb-8 mt-4 text-3xl font-semibold">My Area</h1>
        <pre>{JSON.stringify({ user, permissions }, null, 2)}</pre>
      </div>
    </main>
  );
}
