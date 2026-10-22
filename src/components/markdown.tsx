import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Children, isValidElement, type ReactNode } from "react";
import { headingId } from "@/lib/format";
function textOf(children: ReactNode): string {
  return Children.toArray(children).map(child => typeof child === "string" || typeof child === "number" ? String(child)
    : isValidElement<{ children?: ReactNode }>(child) ? textOf(child.props.children) : "").join("");
}
export function Markdown({ body }: { body: string }) {
  return <div className="prose-content"><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} skipHtml components={{
    // Source positions keep repeated titles distinct without mutable render counters.
    h2: ({ children, node }) => <h2 id={`${headingId(textOf(children)) || "section"}-${node?.position?.start.line ?? 0}`}>{children}</h2>,
    h3: ({ children, node }) => <h3 id={`${headingId(textOf(children)) || "section"}-${node?.position?.start.line ?? 0}`}>{children}</h3>,
    a: ({ href, children }) => <a href={href?.startsWith("https://") || href?.startsWith("/") || href?.startsWith("#") ? href : undefined} rel="noopener noreferrer" target={href?.startsWith("https://") ? "_blank" : undefined}>{children}</a>,
    img: ({ src, alt }) => typeof src === "string" && src.startsWith("/api/media/") ? <img src={src} alt={alt || "文章图片"} loading="lazy" decoding="async"/> : <span className="image-unavailable">{alt || "图片"} · 请使用本站上传图片</span>
  }}>{body}</ReactMarkdown></div>;
}
