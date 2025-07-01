import React from "react";
import { render, act } from "@testing-library/react";
import { useHighlightNewIndicator } from "./hooks";

// Mock react-scroll's scroller
jest.mock("react-scroll", () => ({
  scroller: {
    scrollTo: jest.fn(),
  },
}));
import { scroller } from "react-scroll";

function makeIndicatorElement(id: string) {
  return <div id={id} />;
}

function TestComponent({
  indicators,
  editable,
}: {
  indicators: JSX.Element[];
  previousIndicators?: JSX.Element[];
  editable: boolean;
}) {
  useHighlightNewIndicator(editable, indicators);
  return null;
}

describe("useHighlightNewIndicator", () => {
  let getElementByIdSpy: jest.SpyInstance;
  let classListAddMock: jest.Mock;
  let classListRemoveMock: jest.Mock;
  let addEventListenerMock: jest.Mock;
  let animationEndCallback: (() => void) | undefined;

  beforeEach(() => {
    jest.useFakeTimers();
    classListAddMock = jest.fn();
    classListRemoveMock = jest.fn();
    animationEndCallback = undefined;
    addEventListenerMock = jest.fn((event, cb) => {
      if (event === "animationend") {
        animationEndCallback = cb;
      }
    });
    getElementByIdSpy = jest.spyOn(document, "getElementById").mockImplementation((id) => {
      return {
        classList: {
          add: classListAddMock,
          remove: classListRemoveMock,
        },
        addEventListener: addEventListenerMock,
        id,
      } as unknown as HTMLElement;
    });
    (scroller.scrollTo as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should not trigger for non-editable (default indicators)", () => {
    const indicators = [makeIndicatorElement("widget-1-a")];
    render(<TestComponent indicators={indicators} editable={false} />);
    expect(getElementByIdSpy).not.toHaveBeenCalled();
    expect(scroller.scrollTo).not.toHaveBeenCalled();
  });

  it("should scroll and animate new indicator", () => {
    const prevIndicators = [makeIndicatorElement("widget-1-a")];
    const indicators = [makeIndicatorElement("widget-1-a"), makeIndicatorElement("widget-2-b")];
    const { rerender } = render(
      <TestComponent indicators={prevIndicators} editable={true} />,
    );
    rerender(<TestComponent indicators={indicators} editable={true} />);
    act(() => {
      jest.runAllTimers();
    });
    expect(getElementByIdSpy).toHaveBeenCalledWith("widget-2-b");
    expect(scroller.scrollTo).toHaveBeenCalledWith("widget-2-b", expect.any(Object));
    expect(classListAddMock).toHaveBeenCalledWith("animate-outline-in");

    // Simulate animationend event after class is added
    act(() => {
      animationEndCallback && animationEndCallback();
    });
    expect(classListRemoveMock).toHaveBeenCalledWith("animate-outline-in");
  });

  it("should not animate if indicators length is the same", () => {
    const prevIndicators = [makeIndicatorElement("widget-1-a")];
    const indicators = [makeIndicatorElement("widget-1-a")];
    const { rerender } = render(
      <TestComponent indicators={prevIndicators} editable={true} />,
    );
    rerender(<TestComponent indicators={indicators} editable={true} />);
    expect(getElementByIdSpy).not.toHaveBeenCalled();
    expect(scroller.scrollTo).not.toHaveBeenCalled();
  });
});
