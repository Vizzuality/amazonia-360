import React from "react";

import { scroller } from "react-scroll";

import { render, act } from "@testing-library/react";

import { useHighlightNewIndicator } from "./hooks";

// Mock react-scroll's scroller
jest.mock("react-scroll", () => ({
  scroller: {
    scrollTo: jest.fn(),
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
  let getElementByIdSpy: jest.SpyInstance;
  let classListAddMock: jest.Mock;
  let classListRemoveMock: jest.Mock;
  let addEventListenerMock: jest.Mock;
  let removeEventListenerMock: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    classListAddMock = jest.fn();
    classListRemoveMock = jest.fn();
    addEventListenerMock = jest.fn();
    removeEventListenerMock = jest.fn();

    getElementByIdSpy = jest.spyOn(document, "getElementById").mockImplementation((id) => {
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

    (scroller.scrollTo as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it("should not trigger when disabled", () => {
    const indicators = [makeIndicatorElement("widget-1-a")];
    render(<TestComponent indicators={indicators} disabled={true} />);

    act(() => {
      jest.runAllTimers();
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
      jest.runAllTimers();
    });

    expect(getElementByIdSpy).toHaveBeenCalledWith("widget-2-b");
    expect(scroller.scrollTo).toHaveBeenCalledWith("widget-2-b", expect.any(Object));
  });
});
