import React from "react";

import { scroller } from "react-scroll";

import { render, act } from "@testing-library/react";
import { vi, Mock, MockInstance } from "vitest";

import { useHighlightNewIndicator } from "./hooks";

// Mock react-scroll's scroller
vi.mock("react-scroll", () => ({
  scroller: {
    scrollTo: vi.fn(),
  },
}));

function makeIndicatorElement(id: string) {
  return <div id={id} />;
}

function TestComponent({
  indicators,
  disabled,
}: {
  indicators: React.JSX.Element[];
  disabled?: boolean;
}) {
  const gridRef = React.useRef<HTMLDivElement>(null);
  useHighlightNewIndicator(indicators, disabled);
  return <div ref={gridRef} />;
}

describe("useHighlightNewIndicator", () => {
  let getElementByIdSpy: MockInstance;
  let classListAddMock: Mock;
  let classListRemoveMock: Mock;
  let addEventListenerMock: Mock;
  let removeEventListenerMock: Mock;

  beforeEach(() => {
    vi.useFakeTimers();
    classListAddMock = vi.fn();
    classListRemoveMock = vi.fn();
    addEventListenerMock = vi.fn();
    removeEventListenerMock = vi.fn();

    getElementByIdSpy = vi.spyOn(document, "getElementById").mockImplementation((id) => {
      return {
        dataset: {
          status: "",
        },
        classList: {
          add: classListAddMock,
          remove: classListRemoveMock,
        },
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
        id,
      } as unknown as HTMLElement;
    });

    (scroller.scrollTo as Mock).mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  it("should not trigger when disabled", () => {
    const indicators = [makeIndicatorElement("widget-1-a")];
    render(<TestComponent indicators={indicators} disabled={true} />);

    act(() => {
      vi.runAllTimers();
    });

    expect(getElementByIdSpy).not.toHaveBeenCalled();
    expect(scroller.scrollTo).not.toHaveBeenCalled();
  });

  it("should scroll and animate new indicator", () => {
    const prevIndicators = [makeIndicatorElement("widget-1-a")];
    const indicators = [makeIndicatorElement("widget-1-a"), makeIndicatorElement("widget-2-b")];

    const { rerender } = render(<TestComponent indicators={prevIndicators} />);
    rerender(<TestComponent indicators={indicators} />);

    act(() => {
      vi.runAllTimers();
    });

    expect(getElementByIdSpy).toHaveBeenCalledWith("widget-2-b");
    expect(scroller.scrollTo).toHaveBeenCalledWith("widget-2-b", expect.any(Object));
  });
});
