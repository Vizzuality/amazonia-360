export default function FeedbackButton() {
  return (
    <div className="fixed top-1/2 right-0 -translate-y-1/2">
      <a
        href="#"
        target="_blank"
        className="group block -translate-y-28 -rotate-90 text-white bg-blue-500 px-4 py-1 rounded-t-lg shadow-lg z-50 origin-bottom-right hover:bg-blue-600 hover:shadow-xl transition-all duration-200 ease-in-out"
      >
        <span className="block group-hover:translate-x-1 transition-all duration-200 ease-in-out">
          Feedback
        </span>
      </a>
    </div>
  );
}
