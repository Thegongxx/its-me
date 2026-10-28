# 首页主视觉 · Open form

- 用途：Xuan 首页的装饰雕塑，用来表现“正在成形”；不作为真实个人作品或项目成果。
- 生成方式：内置 ImageGen 工具，2026-10-22。没有使用参考站的图像素材。
- 项目文件：`public/visuals/open-form.webp`，1254 × 1254，透明通道，178,580 bytes。
- 优化：生成 PNG 保留在本机 ImageGen 输出目录；项目使用 Sharp 转换的 WebP（quality 88、alphaQuality 100）。未改变图像内容。
- 呈现：Next Image 提供响应式资源；Motion 分别处理滚动与指针两个图层。它是位图的视差效果，不是可任意旋转的 3D 模型。

## 最终生成提示词

Use case: stylized-concept. Asset type: original sculptural hero artwork for Xuan's personal portfolio website, not a website screenshot. Create one exquisitely rendered sculptural object on a TRUE TRANSPARENT background. A monumental continuous folded metal sheet forms an open asymmetric circular orbit, like a piece of architectural calligraphy hovering in space. Three very broad satin-chrome folds sweep in one continuous loop, one edge unfurls outward and one aperture remains open. Strong tangible depth, elegant large surfaces, not a tangle of thin wires. Brushed platinum aluminum on the outer surface, warm burnished bronze reflected on the inner surfaces, fine soft specular highlights. Slightly inclined three-quarter camera, object centered, generous margin around every edge, completely in frame. Art-directed museum installation meets luxury industrial design. Dramatic warm studio light from upper left, thin luminous cool rim on the right, very convincing subtle reflections and delicate machining texture, crisp silhouette. Square composition 1536x1536 if possible. Will be placed over a dark olive-black website background, so highlights and edges need to remain readable there. Avoid letters, X shapes, text, logo, watermarks, pedestal, floor, cast background shadow, scenery, stars, glows, neon, cheap plastic, excessive details. The artwork should feel sculpted and deliberate, a beautiful unfinished orbit, not a generic donut.

工具参数：`transparent_background: true`。实际输出尺寸为 1254 × 1254；页面按实际尺寸声明宽高。
