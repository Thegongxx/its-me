# GitHub → Vercel 与数据库部署

代码发布和数据库迁移分别管理。用户目前要求不配置 Vercel；以下是后续操作步骤，不是已完成的部署记录。

## 1. 分开环境

| 项目 | 本地 | Vercel Preview | Vercel Production |
| --- | --- | --- | --- |
| Supabase | 本地或独立开发项目 | 独立预览项目 | 独立生产项目 |
| `DEMO_MODE` | `true` 可看示例 | 联调时 `false` | `false` |
| `NEXT_PUBLIC_SITE_URL` | `http://127.0.0.1:3000` | 当前稳定预览域名的完整 origin | 正式 HTTPS 域名 |
| Supabase URL / publishable key | 开发项目 | 预览项目 | 生产项目 |
| service-role key | 本机 `.env.local` | Preview 的服务端环境变量 | Production 的服务端环境变量 |

不要把生产密钥复制到预览环境。`NEXT_PUBLIC_` 变量会进入客户端构建；service-role 变量必须没有该前缀。不要提交 `.env.local`、凭证、数据库导出或日志。

## 2. 单独迁移数据库

先核对 Supabase 项目的名称、project ref 和环境，确认数据库备份与恢复方式。通过 SQL Editor 依次执行：

1. `202610220001_archive.sql`：内容、资料、知识分类、管理员与 RLS。
2. `202610220002_presence.sql`：设备、原子上报/撤销/切换、公开状态与 Realtime publication。
3. `202610220003_media.sql`：私有图片 bucket、Storage RLS。

每份迁移包含事务。只对尚未应用对应版本的环境执行，保留迁移历史；不要在正常升级中反复重放建表 SQL。使用 Supabase CLI 的团队可在本机安装官方 CLI 后，以所选项目 ref 执行 `supabase link --project-ref YOUR_PROJECT_REF`、先 `supabase db push --dry-run` 再 `supabase db push`。SQL Editor 手动执行和 CLI 迁移历史需要明确选择一种管理方式；如果切换，先按官方 migration repair 指引对齐历史，避免重复执行。

**网站 build/start/CI 都不会迁移数据库。** 后续变更新增迁移文件；生产先备份、评估兼容性，再单独发布。回滚应用使用 Vercel 既有部署；数据库回滚需单独的修复迁移或备份恢复，不能假定回退 Git 自动回退数据。

在 Auth 创建邮箱/密码管理员，关闭公开注册。按 `supabase/admin.example.sql` 将其 UUID 加入 allowlist。管理员名单只能由受信任的数据库管理流程维护，前台与用户 metadata 都不能授权管理员。

## 3. 导入代码

在 Vercel 的 New Project 中导入 `Thegongxx/its-me`。仓库根目录就是 Next.js 项目，Framework Preset 选择 Next.js，Node.js 选择 24，安装 `npm ci`，构建 `npm run build`，Output Directory 使用框架默认值。

分别配置 Preview 与 Production 环境变量，先部署 Preview。开发分支自动生成预览，生产分支通常为 `main`。绑定正式域名后更新 Production 的 `NEXT_PUBLIC_SITE_URL` 并重新部署。

后台写入检查请求 Origin，必须与 `NEXT_PUBLIC_SITE_URL` 一致。预览建议使用稳定的分支域名；如果换临时域名，更新 Preview 变量并重新构建。不要为方便测试放开任意跨域写入。

## 4. 上线验收

在预览环境完成以下实测后再部署生产：

- 未登录只能读取发布内容；普通已登录账号看到权限拒绝且 API 写入为 403；管理员能保存草稿与发布。
- 图片仅限已发布父记录或管理员读取；撤回发布后再次请求旧图片 URL 无法读取。
- 向 Markdown 输入原始 HTML、脚本链接，确认不会执行。
- 配置 Windows 凭证、允许应用白名单，观察初始拉取、Realtime 更新、重连刷新。
- 断开采集器超过 90 秒，网页在没有新推送时仍显示过期；暂停/撤销/切换设备后旧状态清除，旧凭证失效。
- 手机、平板、桌面检查导航、搜索、详情、后台和 X 手势；检查减少动态效果、键盘和加载失败。

生产再次检查管理员权限、数据归属、origin、TLS 和设备指向。不得将预览通过等同于生产通过。

官方参考：[Vercel Next.js](https://vercel.com/docs/frameworks/full-stack/nextjs)、[Supabase 环境与迁移](https://supabase.com/docs/guides/deployment/managing-environments)、[Supabase Next.js 服务端 Auth](https://supabase.com/docs/guides/auth/server-side/nextjs)。
