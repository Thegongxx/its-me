# Xuan 架构与设计

从空目录创建的独立项目。当前信息架构采用用户后续确认：整站用于个人履历展示；实时状态留在首页，不再有单独的简历与动态板块。

## 页面关系

| URL | 目的与布局 |
| --- | --- |
| `/` | 署名与立体作品封面 → 作品选集 → 笔记索引 → 紧凑实时状态 |
| `/work` | 分类筛选、两列大幅封面；手机一列 |
| `/work/[slug]` | 项目信息、过程、贡献、Markdown 与外部证据 |
| `/learn` | 分类索引、搜索、带日期的阅读目录 |
| `/learn/[slug]` | 有限正文宽度、目录与关联项目 |
| `/about` | 个人介绍、经历与联系方式；未知资料明确待填写 |
| `/admin` | 独立工作台，分区编辑资料、经历、作品、笔记、分类和设备 |
| `/resume`、`/now` | 兼容重定向到 `/about`、`/#now`，不出现在导航与 sitemap |

App Router 独立 URL，列表筛选保留在 URL 中，支持直接访问、刷新与前进后退。服务端组件读取公开内容；封面转场、导航菜单、状态订阅和表单是客户端边界。

## 数据与权限

- `admin_users`：管理员 Auth UUID allowlist。只有数据库管理流程能维护；用户 metadata 不参与授权。
- `profiles`、`experiences`：资料与真实经历，有发布状态。
- `entries`：`project`/`learn`、草稿/发布、slug、Markdown、封面、贡献、链接与日期。
- `categories`、`entry_categories`：知识分类与内容多对多。学习记录还可关联真实项目证据。
- `devices`：只存凭证哈希，90 天有效期、撤销时间、心跳与单调递增序号。不公开。
- `sharing_settings`：全局开关与当前唯一有效设备。
- `public_status`：类别、状态、服务器心跳/过期时间，不含进程名/标题/路径/设备名称。
- 私有 Storage `project-media`：entry UUID 目录，游客只读发布记录所属图片。

公开查询使用 publishable key + RLS。后台每次先 `getUser()` 验证登录，再调用 `is_admin()` 验证授权；Route Handler 与数据库 RLS 双重检查。管理员不能从 API 读取设备 token hash。原始凭证仅创建响应返回一次。

后台 JSON 严格校验、大小上限、同源 Origin 检查。上传图片经 Sharp 校验、限制像素/体积、缩放转 WebP、剥离元数据。媒体通过受控 API 输出，禁用共享缓存，以免撤回发布后仍可由缓存读出。Markdown 禁止原始 HTML、sanitize、限定协议；内容图片也走受控媒体路径。

## 状态链路

```text
Windows 白名单 + 空闲/手动状态
  → HTTPS Bearer 设备凭证 + { sequence, category, state }
  → Route Handler 严格校验
  → service-role 原子 ingest RPC
  → public_status → Supabase Realtime → 首页状态
```

RPC 按一致顺序锁定共享设置与设备；验证哈希、有效期、撤销、活动设备、序号与频率。服务器赋予 90 秒 TTL。切换、暂停与撤销在事务中清除旧公开状态。service-role 仅用于设备受限 RPC，不进入客户端或采集器。

页面首次加载、Realtime 建连/重连、focus/online 时重新读取；30 秒轮询兜底。每秒独立评估过期，使用 API server_time 与 performance.now 时间偏差，避免本机钟差使离线状态持续显示在线。不用软件时长推断任何学习能力。

## 设计系统与交互

米白 `#f3f0e9`、炭黑 `#292622`、暗红 `#813b32`、暖灰 `#6f695f`。Instrument Serif 用于英文标题与署名，Manrope / Noto Sans SC 用于阅读，IBM Plex Mono 只用于少量数据标记。全部来自锁定的本地 Fontsource 包。

首页采用个人作品册的构图。CSS perspective 与 transform 形成封面的层次；`CoverReel` 是唯一的首屏客户端边界，通过 Motion 的 scrollYProgress 更新 CSS 变量。服务器提供内容、图片和有效链接。没有自动漂浮、旋转手势、滚轮劫持或 WebGL；首屏过渡结束后，原生文档流继续呈现作品和笔记。

桌面转场淡出的封面、介绍及向下链接设置 inert，避免不可见的键盘焦点；回到开场或调整到手机尺寸时恢复。手机不使用 sticky 长场景，改为署名、介绍、封面上下排列。减少动态偏好使用静态布局。原生前进后退、可见焦点、跳到主要内容和菜单 Escape 关闭保留。

作品目录为错落双列，手机改为单列；笔记为带分类、日期和搜索的索引；详情限制阅读宽度。关于页移除大 X 与重复介绍。示例图保留明确标识，配色调整为中性灰、陶土与炭黑。无真实项目图片时不生成伪造产品截图。

## 环境边界

`DEMO_MODE=true` 才读取明确标识的本地示例，后台禁止写入。真实模式无数据为空状态，连接失败为错误页，不自动替换为示例。

迁移与代码发布分离；Preview 和 Production 分开 Supabase 项目。真实云端登录、Storage、Realtime、HTTPS 采集链路需配置后验收，现有数据库测试不能代替托管环境验证。

### 连续封面（2026-10-22）

首页的 CoverReel 仅作为客户端运动控制器：服务端仍输出项目图片、文字和链接。每张图片只存在于对应作品文章中；未变换的 cover-slot 提供最终几何位置，ResizeObserver 在尺寸变化后重测。reel-motion 负责纯几何插值，Motion 的弹簧值只调整场景进度，不拦截滚轮或触摸滚动。端点强制落到真实位置，避免快速锚点跳转与历史恢复产生拖尾。

ProjectCover 通过 React 19.3 ViewTransition 共享首页/目录与详情的同一项目身份。Link 使用 project-open 类型区分进入方向；CSS 选择一个快照防止不同裁切比例的重影。NextEntry 不参与共享配对，避免未点击的封面从首屏飞到详情页底部。没有手动接管 Router、浏览器历史或使用实验配置。
