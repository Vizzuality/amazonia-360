import { render, screen } from "@testing-library/react";

import PdfTopicCover from "./cover";

vi.unmock("react-markdown");
vi.unmock("rehype-raw");

vi.mock("@/app/(frontend)/store", () => ({ useFormTopics: () => ({ topics: [] }) }));

const TOPIC = {
  id: 1,
  name: "Territory",
  image: "/images/topics/territory.webp",
  default_visualization: [],
} as unknown as Parameters<typeof PdfTopicCover>[0];

describe("PdfTopicCover", () => {
  test("renders the topic description's Markdown instead of printing it", () => {
    render(<PdfTopicCover {...TOPIC} description={"Explore **land cover** in your region"} />);

    expect(screen.getByText("land cover").tagName).toBe("STRONG");
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument();
  });
});
