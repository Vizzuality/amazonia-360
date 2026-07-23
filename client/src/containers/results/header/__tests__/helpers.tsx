import { vi } from "vitest";

import { DropdownMenu, DropdownMenuContent } from "@/components/ui/dropdown";

export function DropdownMenuWrapper({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenu open>
      <DropdownMenuContent>{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

export function createMockMutation(overrides: Record<string, unknown> = {}) {
  return {
    isPending: false,
    isSuccess: false,
    isError: false,
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    ...overrides,
  };
}
