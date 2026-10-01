import { useRef } from "react";

import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@integration/wrappers/render";

import { useFitsInline } from "./use-fits-inline";

function Harness({ resetKey = "en" }: { resetKey?: string }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);
  const fitsInline = useFitsInline({ rowRef, linksRef, fallbackRef, resetKey });

  return (
    <div
      ref={rowRef}
      data-testid="row"
      style={{
        display: "flex",
        justifyContent: "space-between",
        width: 1200,
        boxSizing: "border-box",
      }}
    >
      <div>
        <div style={{ width: 400, height: 10 }} />
      </div>
      <div style={{ display: "flex", flexGrow: 1 }}>
        <div style={{ width: 200, height: 10 }} />
      </div>
      <div style={{ position: "relative", display: "flex", gap: 16, flexShrink: 0 }}>
        {fitsInline && (
          <nav ref={linksRef} data-testid="links" style={{ width: 300, height: 10 }} />
        )}
        {!fitsInline && (
          <div
            ref={fallbackRef}
            data-testid="burger"
            style={{ position: "relative", width: 24, height: 10 }}
          ></div>
        )}
        <div style={{ width: 50, height: 10 }} />
        {!fitsInline && (
          <div style={{ position: "absolute", top: 0, left: 24, width: 600, height: 10 }} />
        )}
      </div>
    </div>
  );
}

async function setRowWidth(width: number) {
  const row = document.querySelector<HTMLElement>('[data-testid="row"]')!;
  row.style.width = `${width}px`;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

describe("useFitsInline", () => {
  it("keeps the links inline while the row has room", async () => {
    const { screen } = await renderWithProviders(<Harness />);

    await expect.element(screen.getByTestId("links")).toBeInTheDocument();
  });

  it("collapses when the links overflow the row", async () => {
    const { screen } = await renderWithProviders(<Harness />);

    await setRowWidth(800);

    await expect.element(screen.getByTestId("links")).not.toBeInTheDocument();
  });

  it("stays collapsed until the links would fit again, then expands", async () => {
    const { screen } = await renderWithProviders(<Harness />);

    await setRowWidth(800);
    await expect.element(screen.getByTestId("links")).not.toBeInTheDocument();

    await setRowWidth(900);
    await expect.element(screen.getByTestId("links")).not.toBeInTheDocument();

    await setRowWidth(1200);
    await expect.element(screen.getByTestId("links")).toBeInTheDocument();
  });

  it("re-expands when the links fit with less slack than the hamburger width", async () => {
    const { screen } = await renderWithProviders(<Harness />);

    await setRowWidth(960);
    await expect.element(screen.getByTestId("links")).not.toBeInTheDocument();

    await setRowWidth(970);
    await expect.element(screen.getByTestId("links")).toBeInTheDocument();
  });

  it("re-expands when an off-screen panel inside the collapsed group inflates its content", async () => {
    const { screen } = await renderWithProviders(<Harness />);

    await setRowWidth(700);
    await expect.element(screen.getByTestId("links")).not.toBeInTheDocument();

    await setRowWidth(1300);
    await expect.element(screen.getByTestId("links")).toBeInTheDocument();
  });
});
