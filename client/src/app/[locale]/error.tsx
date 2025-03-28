"use client";

export default function Custom500() {
  return (
    <div className="text-blue-ocean flex h-[calc(100svh_-_theme(space.40)_+_1px)] w-screen flex-col items-center justify-center bg-white">
      <div className="max-w-[601px] text-center">
        <h1 className="text-bold mb-[28px] text-xl">500 - INTERNAL SERVER ERROR</h1>
        <p className="text-large">
          The server encountered an internal error or misconfiguration and was unable to complete
          your request.
        </p>
      </div>
    </div>
  );
}
