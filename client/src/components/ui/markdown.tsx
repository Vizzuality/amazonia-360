import ReactMarkdown from "react-markdown";

import rehypeRaw from "rehype-raw";

import { cn } from "@/lib/utils";

export const Markdown = ({ children, className }: { children?: string; className?: string }) => {
  return (
    <ReactMarkdown
      className={cn("prose prose-sm font-medium prose-a:break-words", className)}
      rehypePlugins={[rehypeRaw]}
      components={{
        a: (props) => (
          <a href={props.href} target="_blank" rel="noopener noreferrer">
            {props.children}
          </a>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
};
