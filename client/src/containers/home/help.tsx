import { Button } from "@/components/ui/button";

export default function Help() {
  return (
    <section className="bg-blue-700 text-white">
      <div className="container">
        <div className="flex flex-col items-center justify-between py-16 md:flex-row">
          <div className="flex flex-col justify-start pt-16 md:py-0">
            <h3 className="text-lg font-bold">Help us improve!</h3>
            <p className="max-w-2xl font-normal">
              AmazoniaForever360+ is in active development, and your feedback is vital to helping us
              improve. We invite you to share your thoughts and help shape the next phase of
              AmazoniaForever360+!
            </p>
          </div>
          <div className="flex flex-col items-center pt-16 md:py-0">
            <a
              href="https://survey123.arcgis.com/share/fadbaa4e81f04f068f5ed0abd99e4789"
              target="_blank"
              rel="noreferrer"
            >
              <Button size="lg" variant="secondary" className="mt-4">
                Give feedback
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
