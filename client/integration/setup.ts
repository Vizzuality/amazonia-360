import { vi } from "vitest";

import "./a11y-matchers";

vi.mock("@/app/(frontend)/[locale]/(app)/auth/sign-in/actions", () => ({
  signInAction: vi.fn(),
}));

globalThis.process ??= { env: {} } as typeof globalThis.process;
Object.assign(process.env, import.meta.env);

if (window.history.state === null) {
  window.history.replaceState({}, "");
}

const OVERLAY_SLOTS = [
  "alert-dialog-content",
  "alert-dialog-overlay",
  "dialog-content",
  "dialog-overlay",
  "dropdown-menu-content",
  "popover-content",
  "select-content",
  "sheet-content",
  "sheet-overlay",
  "tooltip-content",
];

const overlaySelector = OVERLAY_SLOTS.map((slot) => `[data-slot="${slot}"]`).join(",");

const overlayStackingStyle = document.createElement("style");
overlayStackingStyle.textContent = `${overlaySelector} { position: relative; z-index: 50; }`;
document.head.appendChild(overlayStackingStyle);
