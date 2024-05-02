export type Topic = {
  id: string;
  label: string;
  image: string;
  description: string;
};

export const TOPICS = [
  {
    id: "natural-physical-environment",
    label: "Natural Physical Environment",
    image: "/images/topics/natural-physical-environment.png",
    description:
      "Get data on infrastructure, agriculture, mining, logging, livestock, and fishing.",
  },
  {
    id: "sociodemographics",
    label: "Sociodemographics",
    image: "/images/topics/population.png",
    description: "Understand the demographics of your area of interest.",
  },
  {
    id: "land-use-and-conservation",
    label: "Land use and Conservation",
    image: "/images/topics/protection.png",
    description:
      "Get data on infrastructure, agriculture, mining, logging, livestock, and fishing.",
  },
  {
    id: "bioeconomy",
    label: "Bioeconomy Research Centers",
    image: "/images/topics/bioeconomy.png",
    description:
      "Data relating to research centers, bioeconomy-related researchers, and other academic endeavors.",
  },
  {
    id: "financial",
    label: "IDB Operations",
    image: "/images/topics/financial.png",
    description: "Understand the IDB operations in your area of interest.",
  },
] as const satisfies Topic[];

export type TopicIds = (typeof TOPICS)[number]["id"];
