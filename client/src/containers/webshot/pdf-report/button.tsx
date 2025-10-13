"use client";

export const PrintButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-50 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 print:hidden"
    >
      Print
    </button>
  );
};

export default PrintButton;
