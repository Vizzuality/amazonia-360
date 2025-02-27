import ReactMarkdown from "react-markdown";

import { cn } from "@/lib/utils";

export const Markdown = ({ children, className }: { children?: string; className?: string }) => {
  return <ReactMarkdown className={cn("prose prose-sm", className)}>{children}</ReactMarkdown>;
};
