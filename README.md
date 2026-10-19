# dsh-link-open

在 DeepSeek Harness 桌面客户端里**右键链接，用默认浏览器打开**。

## 功能

- 在任意 http/https 链接上右键，弹出小菜单：
  - **在默认浏览器中打开**
  - **复制链接**
- 普通文字的右键不受影响。

## 安装

```bash
dsh plugin --profile desktop add github:starash07/dsh-link-open
```

也可以下载 Release 里的 `dsh-link-open-1.0.0.tgz`，用本地路径安装：

```bash
dsh plugin --profile desktop add file:<tgz 的绝对路径>
```

安装后重启桌面客户端。

## 说明

- 打开链接走宿主本地接口，由系统默认浏览器处理（Windows 用 `rundll32 url.dll,FileProtocolHandler`）。
- 仅处理 `http` / `https`，其他协议（`file:`、`dsh:` 等）不接管。
- 仅验证于 DSH 0.2.1-rc.2 桌面端（Electron 44）。

## License

MIT
