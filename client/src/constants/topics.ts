export type Topic = {
  id: string;
  label: string;
  image: string;
  description: string;
};

export const TOPICS = [
  {
    id: "environmental",
    label: "Environmental",
    image: "/images/topics/environmental.png",
    description:
      "Explore your region's ecosystem through satellite imagery, biodiversity records, and land use patterns.",
  },
  {
    id: "demographic-and-socioeconomic",
    label: "Demographic and Socioeconomic",
    image: "/images/topics/demographic-and-socioeconomic.png",
    description: "Understand the demographics of your area of interest.",
  },
  {
    id: "climate-and-metorological",
    label: "Climate and Metorological",
    image: "/images/topics/climate-and-metorological.png",
    description:
      "Information covering hydrology, fire occurrences, air quality, etc.",
  },
  {
    id: "human-activity-land-cover",
    label: "Human Activity / Land Cover",
    image: "/images/topics/human-activity-land-cover.png",
    description:
      "Get data on infrastructure, agriculture, mining, logging, livestock, and fishing.",
  },
  {
    id: "academic-and-research-data",
    label: "Academic and Research Data",
    image: "/images/topics/academic-and-research-data.png",
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
