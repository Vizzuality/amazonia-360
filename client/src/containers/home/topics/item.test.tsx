import { render, screen } from "@testing-library/react";

import TopicsItem from "./item";

vi.unmock("react-markdown");
vi.unmock("rehype-raw");

const TOPIC = {
  id: 1,
  name: "Territory",
  image: "/images/topics/territory.webp",
  default_visualization: [],
} as unknown as Parameters<typeof TopicsItem>[0];

describe("TopicsItem", () => {
  test("renders the description's Markdown instead of printing it", () => {
    render(<TopicsItem {...TOPIC} description={"Explore **land cover** in your region"} />);

    expect(screen.getByText("land cover").tagName).toBe("STRONG");
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument();
  });
});
