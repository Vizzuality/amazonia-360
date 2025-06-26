import React from "react";

import { render, act } from "@testing-library/react";

import type { TopicView, IndicatorView } from "@/app/parsers";

import { useHighlightNewIndicator } from "./hooks";

function TestComponent({
  topic,
  previousTopic,
  editable,
}: {
  topic: TopicView;
  previousTopic?: TopicView;
  editable: boolean;
}) {
  useHighlightNewIndicator(topic, previousTopic, editable);
  return null;
}

describe("useHighlightNewIndicator", () => {
  let getElementByIdSpy: jest.SpyInstance;
  let scrollIntoViewMock: jest.Mock;
  let classListAddMock: jest.Mock;
  let classListRemoveMock: jest.Mock;
  let addEventListenerMock: jest.Mock;
  let animationEndCallback: (() => void) | undefined;

  beforeEach(() => {
    jest.useFakeTimers();
    scrollIntoViewMock = jest.fn();
    classListAddMock = jest.fn();
    classListRemoveMock = jest.fn();
    animationEndCallback = undefined;
    addEventListenerMock = jest.fn((event, cb) => {
      if (event === "animationend") {
        animationEndCallback = cb;
      }
    });
    getElementByIdSpy = jest.spyOn(document, "getElementById").mockImplementation(() => {
      return {
        scrollIntoView: scrollIntoViewMock,
        classList: {
          add: classListAddMock,
          remove: classListRemoveMock,
        },
        addEventListener: addEventListenerMock,
      } as unknown as HTMLElement;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function makeIndicator(id: number, type: string): IndicatorView {
    return { id, type } as IndicatorView;
  }
  function makeTopic(id: number, indicators: IndicatorView[] | undefined): TopicView {
    return { id, indicators };
  }

  it("should not trigger for non-editable (default indicators)", () => {
    const topic = makeTopic(1, [makeIndicator(1, "a")]);
    const prev = makeTopic(2, []);
    render(<TestComponent topic={topic} previousTopic={prev} editable={false} />);
    expect(getElementByIdSpy).not.toHaveBeenCalled();
  });

  it("should scroll and animate new indicator", () => {
    const prev = makeTopic(1, [makeIndicator(1, "a")]);
    const topic = makeTopic(1, [makeIndicator(1, "a"), makeIndicator(2, "b")]);
    const { rerender } = render(
      <TestComponent topic={prev} previousTopic={undefined} editable={true} />,
    );
    rerender(<TestComponent topic={topic} previousTopic={prev} editable={true} />);
    act(() => {
      jest.runAllTimers();
    });
    expect(getElementByIdSpy).toHaveBeenCalledWith("widget-2-b");
    expect(scrollIntoViewMock).toHaveBeenCalled();
    expect(classListAddMock).toHaveBeenCalledWith("animate-outline-in");

    // Simulate animationend event after class is added
    act(() => {
      animationEndCallback && animationEndCallback();
    });
    expect(classListRemoveMock).toHaveBeenCalledWith("animate-outline-in");
  });

  it("should not animate if indicators length is the same", () => {
    const prev = makeTopic(1, [makeIndicator(1, "a")]);
    const topic = makeTopic(1, [makeIndicator(1, "a")]);
    const { rerender } = render(
      <TestComponent topic={prev} previousTopic={undefined} editable={true} />,
    );
    rerender(<TestComponent topic={topic} previousTopic={prev} editable={true} />);
    expect(getElementByIdSpy).not.toHaveBeenCalled();
  });
});
