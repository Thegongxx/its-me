import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Markdown } from "@/components/markdown";
describe("safe Markdown", () => {
  it("does not execute or retain raw HTML scripts and frames", () => { const html = renderToStaticMarkup(<Markdown body={'<script>alert(1)</script>\n\n<iframe src="https://evil.example"></iframe>\n\n## Safe heading'}/>); expect(html).not.toContain("<script"); expect(html).not.toContain("<iframe"); expect(html).toContain("Safe heading"); });
  it("blocks dangerous link protocols and arbitrary tracking images", () => { const html = renderToStaticMarkup(<Markdown body={'[click](javascript:alert)\n\n![tracking](https://evil.example/pixel.png)\n\n[valid](https://example.org)'}/>); expect(html).not.toContain("javascript:"); expect(html).not.toContain("<img"); expect(html).toContain('href="https://example.org"'); expect(html).toContain('rel="noopener noreferrer"'); });
  it("supports local private-media URLs without raw HTML", () => { const html = renderToStaticMarkup(<Markdown body={'![My work](/api/media/abc/def.webp)\n\n```js\nconst text = "<script>";\n```'}/>); expect(html).toContain('src="/api/media/abc/def.webp"'); expect(html).toContain('loading="lazy"'); expect(html).toContain("&lt;script&gt;"); });
});
