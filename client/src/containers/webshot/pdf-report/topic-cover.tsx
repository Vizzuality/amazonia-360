import { ReactNode } from "react";

interface TopicCoverProps {
  backgroundImage?: string;
  title: string;
  description?: string;
  header?: ReactNode;
}

export default function TopicCover({
  backgroundImage = "/images/topics/nature.webp",
  title,
  description,
  header,
}: TopicCoverProps) {
  return (
    <>
      <div
        className="h-[60%] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="flex h-full w-full flex-col justify-between bg-gradient-to-t from-black to-transparent">
          {header}
          <div className="gap-2 px-14 pb-20 text-white">
            <h1 className="text-6xl">{title}</h1>
            {description && <p className="ml-2">{description}</p>}
          </div>
        </div>
      </div>
      <div className="flex h-[40%] w-full flex-col justify-between gap-8 bg-blue-50 px-14 py-8 pb-3 text-xs font-thin leading-loose">
        <div className="flex flex-row justify-between gap-6">
          <p>
            The selected area in the Amazonia region, specifically within the state of Amapá,
            presents a varied landscape of social and infrastructural dynamics. Electricity access
            varies significantly across municipalities, with Serra do Navio boasting the highest
            access rate at 88.34%, while Mazagão falls behind at 60.88%. This disparity highlights
            the uneven distribution of essential services in the region. Despite these challenges,
            the presence of hospitals, such as the Unidade Mista de Saúde, indicates some level of
            health infrastructure, albeit limited.
          </p>
          <p>
            In contrast, the region is marked by significant social challenges, with a notable
            occurrence of political violence. The data reveals frequent battles and armed clashes,
            along with incidents of violent demonstrations and peaceful protests. Furthermore, the
            homicide rate in Amapá stands alarmingly high at 70.63 per 100,000 inhabitants,
            underscoring the urgent need for improved security measures. The lack of data on higher
            education centers and state presence further suggests areas for development and
            intervention to foster a more equitable and stable environment. *
          </p>
        </div>
        <p className="">*This summary was generated with AI.</p>
      </div>
    </>
  );
}
