export type ResourceProps = {
  title: string;
  author: string;
  type: "database" | "document" | "multimedia";
};

export type ResourcesProps = {
  multimedia: ResourceProps[];
  database: ResourceProps[];
  publications: ResourceProps[];
};
