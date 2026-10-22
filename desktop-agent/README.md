# Xuan Windows 托盘采集器

面向 Windows 10/11。源码运行，依赖固定在 `requirements.txt`，本项目在 Windows / Python 3.14 验证。不会安装 Windows 服务，不需要管理员权限。

## 安装与配置

先在网站 `/admin` → 共享与设备中创建凭证，选择有效设备并保存共享设置。网站需已接入真实 Supabase，HTTPS 可用。然后在 `desktop-agent` 目录执行：

```powershell
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe agent.py doctor
.\.venv\Scripts\python.exe agent.py configure
```

配置程序交互询问网站 HTTPS 地址和设备凭证。凭证输入不回显，不要通过命令行参数、聊天或日志传递。它使用当前 Windows 用户的 DPAPI 加密，写入 `%APPDATA%\BuildLogAgent\credential.bin`。`BuildLogAgent` 是内部兼容目录名，不代表另一个网站。

默认 `paused=true` 且白名单为空。编辑 `%APPDATA%\BuildLogAgent\config.json`，只添加想要公开类别的应用。例如：

```json
{
  "site_url": "https://your-domain.example",
  "allow_local_http": false,
  "whitelist": {
    "code.exe": "development",
    "figma.exe": "design",
    "obsidian.exe": "writing"
  },
  "idle_seconds": 300,
  "heartbeat_seconds": 30,
  "poll_seconds": 2,
  "paused": true,
  "manual_state": null
}
```

`config.example.json` 是带示例白名单的参考文件；程序首次 configure 仍生成**空白名单**。类别限定为 `development`、`design`、`reading`、`writing`、`other`。应用名仅保存在本机，未列入白名单的前台应用上报 `none` 类别，不会推断它正在做什么。

```powershell
.\.venv\Scripts\python.exe agent.py run
```

右键托盘图标 → 恢复共享。菜单还可暂停、选择专注/思考/可交流/离开、编辑并重载白名单、退出。改网站地址或凭证时先退出，再 configure，再启动；热重载仅应用白名单与时间配置。

## 登录 Windows 后启动

在确认配置和手动运行正常后执行：

```powershell
.\.venv\Scripts\python.exe agent.py install-startup
```

只添加当前用户 `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` 下的 `BuildLogAgent`，使用此虚拟环境的 `pythonw.exe`，不弹出终端。保留源目录与虚拟环境路径；移动目录后重新安装启动项。后续启动遵循上次保存的暂停状态。**本次开发没有为用户实际写入启动项。**

```powershell
.\.venv\Scripts\python.exe agent.py uninstall-startup
```

## 发送边界

- 仅上传 `sequence`、`category`、`state` 三个字段；不读取窗口标题，不上传进程名、文件路径、消息、浏览历史或设备身份细节。
- Win32 查询得到的进程路径仅在本机取 basename 用于白名单匹配，不保存/打印完整路径。暂停期间不采样前台进程。
- 本地输入空闲超过默认 300 秒公开 `idle`，类别清空。手动状态仍受暂停、离开和空闲规则约束。
- 状态变化触发上报，默认每 30 秒心跳，最短发送间隔约 3 秒；配置范围由程序验证。
- HTTPS 验证证书，拒绝重定向以避免转发 Bearer 凭证；只有显式 configure `--allow-local-http` 才允许 localhost/127.0.0.1 开发调试。
- 90 天受限设备凭证，只能调用 `/api/device/heartbeat`；服务器只保存哈希。401 后停止并保存暂停；网络失败退避重试；公开状态超过 90 秒自行过期。
- 序号写在本地 `sequence.json`，跨重启递增。不要在相同凭证下删除序号文件；丢失时重新创建设备凭证。
- 日志有限轮转，只含通用错误与 HTTP 状态，不记录凭证或应用名。日志位置同配置目录。

## 故障定位与验证

`doctor` 检查 Win32 前台/空闲 API 和 DPAPI 往返，不发送网络请求、不改启动项。网站 409 通常表示共享关闭、有效设备不匹配或序号问题；401 表示凭证不被接受；429 自动稍后重试。先核对后台共享状态、设备有效期和配置域名。

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

当前已在 Windows 验证本地 API、DPAPI、隐私字段、默认暂停、HTTP 重定向拒绝等。真实 Supabase HTTPS 上报、托盘菜单人工操作及重启登录后的自启仍需在配置好的环境验收，详见 `../docs/verification.md`。
