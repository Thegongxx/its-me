# Xuan · 个人作品与记录

一个独立的个人网站。用作品、学习记录和真实经历介绍自己，首页保留一行公开实时状态。暖白、墨黑、酸橙色，原创 X 立体雕塑贯穿三个首页章节。

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

X 支持拖动旋转、点击展开/合拢、复位和暂停。聚焦雕塑后，方向键旋转，Enter/空格展开，Home/Escape 复位。手机纵向滑动保留页面滚动；减少动态效果偏好关闭自动漂浮、惯性和过渡插值。WebGL 不可用时显示静态图形，正文与导航仍可使用。

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
src/components/           阅读、导航、后台、实时状态与 WebGL 交互
src/lib/                  数据访问、授权、验证和纯逻辑
supabase/migrations/      PostgreSQL / RLS / Storage / Realtime 迁移
desktop-agent/            Windows 托盘采集器与测试
tests/                    权限、设备、过期、数据库、Markdown、手势测试
public/visuals/           原创概念示例插图
docs/                     架构、素材、部署与实际检查记录
```

技术栈：Next.js App Router / React / TypeScript / Tailwind / Motion / Three.js / Supabase。页面与数据读取优先服务端组件；只有交互与实时组件进入客户端。没有独立后端服务。

源码仓库：[Thegongxx/its-me](https://github.com/Thegongxx/its-me)。**当前没有配置 Vercel，也没有提供真实 Supabase 环境；云端登录、图片上传、Realtime 和设备 HTTPS 联调不作为已验证结果。**
