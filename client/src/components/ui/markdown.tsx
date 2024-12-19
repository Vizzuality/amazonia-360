import ReactMarkdown from "react-markdown";

export const Markdown = ({ children }: { children?: string }) => {
  return <ReactMarkdown className="prose prose-sm">{children}</ReactMarkdown>;
};
