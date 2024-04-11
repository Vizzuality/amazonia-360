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
    id: "population",
    label: "Population",
    image: "/images/topics/population.png",
    description: "Understand the demographics of your area of interest.",
  },
  {
    id: "protection",
    label: "Protection, Deforestation and Forest Fires",
    image: "/images/topics/protection.png",
    description:
      "Get data on infrastructure, agriculture, mining, logging, livestock, and fishing.",
  },
  {
    id: "bioeconomy",
    label: "Bioeconomy",
    image: "/images/topics/bioeconomy.png",
    description:
      "Data relating to research centers, bioeconomy-related researchers, and other academic endeavors.",
  },
  {
    id: "financial",
    label: "Financial",
    image: "/images/topics/financial.png",
    description: "Understand the IDB operations in your area of interest.",
  },
] as Topic[] satisfies Topic[];

export type TopicIds =
  | "natural-physical-environment"
  | "population"
  | "protection"
  | "bioeconomy"
  | "financial";
