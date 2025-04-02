import { Button } from "@/components/ui/button";

import { Link } from "@/i18n/navigation";

export default function Custom404() {
  return (
    <div className="text-blue-ocean flex h-[calc(100svh_-_theme(space.40)_+_1px)] w-screen flex-col items-center justify-center bg-white">
      <div className="max-w-[561px] space-y-5 text-center">
        <h1 className="text-bold text-xl">404 - PAGE NOT FOUND</h1>
        <p className="text-large">
          The page you are looking for might have been removed, had its name changed or is
          temporarily unavailable.
        </p>
        <div>
          <Link href="/">
            <Button>Go back to home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
