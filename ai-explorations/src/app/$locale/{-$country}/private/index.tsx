import { createFileRoute } from "@tanstack/react-router";

import { notFound } from "@/lib/navigation";

export const Route = createFileRoute("/$locale/{-$country}/private/")({
  beforeLoad: () => notFound(),
});
