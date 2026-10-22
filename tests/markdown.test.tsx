import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Markdown } from "@/components/markdown";
describe("safe Markdown", () => {
  it("does not execute or retain raw HTML scripts and frames", () => { const html = renderToStaticMarkup(<Markdown body={'<script>alert(1)</script>\n\n<iframe src="https://evil.example"></iframe>\n\n## Safe heading'}/>); expect(html).not.toContain("<script"); expect(html).not.toContain("<iframe"); expect(html).toContain("Safe heading"); });
  it("blocks dangerous link protocols and arbitrary tracking images", () => { const html = renderToStaticMarkup(<Markdown body={'[click](javascript:alert)\n\n![tracking](https://evil.example/pixel.png)\n\n[valid](https://example.org)'}/>); expect(html).not.toContain("javascript:"); expect(html).not.toContain("<img"); expect(html).toContain('href="https://example.org"'); expect(html).toContain('rel="noopener noreferrer"'); });
  it("supports local private-media URLs without raw HTML", () => { const html = renderToStaticMarkup(<Markdown body={'![My work](/api/media/abc/def.webp)\n\n```js\nconst text = "<script>";\n```'}/>); expect(html).toContain('src="/api/media/abc/def.webp"'); expect(html).toContain('loading="lazy"'); expect(html).toContain("&lt;script&gt;"); });
  it("gives repeated formatted headings distinct readable anchors", () => {
    const html = renderToStaticMarkup(<Markdown body={'## **相同** 标题\n\n第一节\n\n## **相同** 标题\n\n### `代码` 与文字'}/>);
    const ids = [...html.matchAll(/<h[23] id="([^"]+)"/g)].map(match => match[1]);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    expect(ids[0]).toMatch(/^相同-标题-/);
    expect(ids[2]).toMatch(/^代码-与文字-/);
  });
  it("does not turn headings inside fenced code into outline targets", () => {
    const html = renderToStaticMarkup(<Markdown body={'## 实际章节\n\n```md\n## 仅为代码示例\n```'}/>);
    expect([...html.matchAll(/<h2 id=/g)]).toHaveLength(1);
    expect(html).toContain('## 仅为代码示例');
  });
});
