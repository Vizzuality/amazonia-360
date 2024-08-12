import Disclaimer from "@/containers/disclaimers";

export default function DemoDisclaimer() {
  return (
    <Disclaimer>
      <div className="container">
        <div className="flex space-x-2">
          <p className="text-sm font-medium">
            This website is a prototype of AmazoniaForever360+, designed to facilitate co-creation
            with select users. The contents and data are for demonstration purposes only and have
            not been fully validated yet. Please refrain from sharing this link, as the
            functionalities presented are intended for demonstration and testing purposes only.
          </p>
        </div>
      </div>
    </Disclaimer>
  );
}
