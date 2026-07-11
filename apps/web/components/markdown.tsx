import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function safeMarkdownUrl(value: string) {
  try {
    const url = new URL(value, "https://markdown.invalid");
    if (url.protocol === "http:" || url.protocol === "https:") return value;
    if (url.protocol === "mailto:") return value;
  } catch {
    return "";
  }
  return "";
}

export function Markdown({ children }: { children: string | null }) {
  if (!children?.trim()) return null;
  return (
    <div className="prose-reading">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => safeMarkdownUrl(url)}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
