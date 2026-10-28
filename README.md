# Xuan · 个人作品与记录

一个独立的个人网站。用作品、学习记录和真实经历介绍自己，首页保留一行公开实时状态。首页采用暗色数字展厅：深橄榄底色、原创银金属雕塑与大字号署名，随原生滚动进入浅色作品展陈和深色思考区。导航为“作品集 / 思考 / 和我”，原有内容页与管理功能保留。

## 本地运行

使用 **Node.js 24 LTS**（`.nvmrc`），依赖版本与 lockfile 已锁定。

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

打开 <http://127.0.0.1:3000>。示例环境 `DEMO_MODE=true` 无须云端账号；作品和笔记明确标注“示例”，后台可预览编辑界面但禁止保存。个人经历、联系方式和成就保留待填写字段。示例内容不会自动写入数据库。

```powershell
npm run typecheck
npm test
npm run build
npm start
```

`npm start` 使用生产构建。不要同时让 dev 与 start 占用同一个端口。Windows 采集器的测试与运行见 [采集器说明](desktop-agent/README.md)。

## 页面与交互

| 路径 | 内容 |
| --- | --- |
| `/` | 介绍 → 作品 → 学习的原生滚动转场；公开状态 |
| `/work`、`/work/[slug]` | 项目筛选、项目过程与证据 |
| `/learn`、`/learn/[slug]` | 分类、搜索、学习正文与关联项目 |
| `/about` | 个人介绍、真实经历、联系方式 |
| `/admin` | 登录、管理员授权、内容、图片、设备与共享设置 |

整站承担个人履历展示，不再设置独立简历页。旧 `/resume` 跳转 `/about`；旧 `/now` 跳转首页状态位置。

首屏使用原创静态雕塑资产配合分层视差：鼠标轻微带动雕塑，滚动使图像缩放、旋转与标题退场，浅色作品区从下方进入。不拦截滚轮，不使用 WebGL 或视频。手机单独调整构图并缩短场景；`prefers-reduced-motion` 关闭滚动变换，无 JavaScript 时保留静态布局。图片、标题与链接均由服务端渲染。主视觉为装饰艺术，不作为个人项目成果，来源和生成提示词见 [素材说明](docs/home-artwork.md)。

作品封面保留有限角度的指针倾斜和光线反馈，悬停和键盘聚焦均有反馈。首页/作品目录的封面通过 React 原生视图转场连接详情页；不支持的浏览器保留正常导航。深色思考区随滚动揭开，正文不随指针移动。详情页底部可继续浏览下一件已发布作品或下一篇笔记。笔记目录从实际渲染的 Markdown 标题生成，随阅读更新当前章节和进度；手机目录默认收起，正文与导航仍使用原生滚动。阅读进度仅表示页面位置，不是学习成果或掌握程度。

## 接入 Supabase

1. 为开发/预览与生产分别创建 Supabase 项目。
2. 对所选环境依次执行 `supabase/migrations/` 的三份 SQL；不导入示例数据。
3. 在 Supabase Auth 创建自己的邮箱/密码账号，关闭公开注册。
4. 从 Auth 复制该账号 UUID，按 `supabase/admin.example.sql` 加入 `admin_users`。仅登录账号不会自动获得管理员权限。
5. 按 `.env.example` 配置 URL、publishable key、仅服务端使用的 service-role key，以及当前网站完整 origin。设置 `DEMO_MODE=false`，重新启动/构建。
6. 登录 `/admin`，填写资料、经历、知识分类，保存草稿，上传封面，检查 Markdown 预览，再发布。

尚未配置时不开放写入；运行中数据库错误会显示错误页，不能悄悄变为示例数据。所有公开内容和私有图片受 RLS / 发布状态限制。详情、字段、部署与验证步骤见 [架构](docs/architecture.md)、[部署](docs/deployment.md)、[检查记录](docs/verification.md)。

## 实时状态

后台创建设备凭证 → 选择有效设备并开启共享 → 在 Windows 采集器中配置凭证和应用白名单 → 从托盘恢复共享。

凭证只显示一次、90 天有效、可撤销，只能向受限上报接口提交状态；采集器不持有 Supabase 密钥。默认暂停、空白名单，不上传窗口标题、路径、聊天或浏览历史。状态变化时上报，正常每 30 秒心跳；超过服务端 90 秒有效期，网页独立计时切换为过期状态。软件使用时间不会成为学习成果。

## 源码目录

```text
src/app/                  App Router 页面、状态和 Route Handlers
src/components/           阅读、导航、后台、实时状态与封面转场
src/lib/                  数据访问、授权、验证和纯逻辑
supabase/migrations/      PostgreSQL / RLS / Storage / Realtime 迁移
desktop-agent/            Windows 托盘采集器与测试
tests/                    权限、设备、过期、数据库、Markdown 测试
public/visuals/           原创概念示例插图
docs/                     架构、素材、部署与实际检查记录
```

技术栈：Next.js App Router / React / TypeScript / Tailwind / Motion / Supabase。页面与数据读取优先服务端组件；只有交互与实时组件进入客户端。没有独立后端服务。

源码仓库：[Thegongxx/its-me](https://github.com/Thegongxx/its-me)。**当前没有配置 Vercel，也没有提供真实 Supabase 环境；云端登录、图片上传、Realtime 和设备 HTTPS 联调不作为已验证结果。**
