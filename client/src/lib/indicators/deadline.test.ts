import { getReadSignal, INDICATOR_READ_TIMEOUT } from "@/lib/indicators/deadline";

describe("getReadSignal", () => {
  it("aborts once the read deadline passes", () => {
    const deadline = new AbortController();
    const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(deadline.signal);

    const signal = getReadSignal();

    expect(timeout).toHaveBeenCalledWith(INDICATOR_READ_TIMEOUT);
    expect(signal.aborted).toBe(false);

    deadline.abort();
    expect(signal.aborted).toBe(true);
  });

  it("aborts when the caller cancels before the deadline", () => {
    const caller = new AbortController();

    const signal = getReadSignal(caller.signal);
    caller.abort();

    expect(signal.aborted).toBe(true);
  });
});
