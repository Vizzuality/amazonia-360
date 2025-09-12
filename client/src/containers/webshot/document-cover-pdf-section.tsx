export default function DocumentCoverPdfSection() {
  return (
    <div className="relative">
      <div className="absolute bottom-[60px] z-10 flex w-[551px] flex-col gap-8 bg-blue-700 px-14 py-10">
        <h1 className="text-6xl text-white">Report on Pando Region</h1>
        <p className="font-normal text-white">
          This report includes a geographic context, population and nature insights.
        </p>
        <p className="font-normal text-white">7 July, 2020 | English Version</p>
      </div>
      <img src="/images/report/world-globe.webp" alt="" role="presentation" />
    </div>
  );
}
