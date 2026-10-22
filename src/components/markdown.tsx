import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Children } from "react";
import { headingId } from "@/lib/format";
function textOf(children: React.ReactNode): string { return Children.toArray(children).map(c => typeof c === "string" || typeof c === "number" ? String(c) : "").join(""); }
export function Markdown({ body }: { body: string }) {
  return <div className="prose-content"><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} skipHtml components={{
    h2: ({ children }) => <h2 id={headingId(textOf(children))}>{children}</h2>,
    h3: ({ children }) => <h3 id={headingId(textOf(children))}>{children}</h3>,
    a: ({ href, children }) => <a href={href?.startsWith("https://") || href?.startsWith("/") || href?.startsWith("#") ? href : undefined} rel="noopener noreferrer" target={href?.startsWith("https://") ? "_blank" : undefined}>{children}</a>,
    img: ({ src, alt }) => typeof src === "string" && src.startsWith("/api/media/") ? <img src={src} alt={alt || "文章图片"} loading="lazy" decoding="async"/> : <span className="image-unavailable">{alt || "图片"} · 请使用本站上传图片</span>
  }}>{body}</ReactMarkdown></div>;
}
