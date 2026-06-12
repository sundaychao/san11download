# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

三国志下载资源汇总 — 纯静态网站，汇总三国志系列游戏的 MOD 和下载资源链接。无框架、无构建工具，使用 vanilla JS + CSS 实现，部署于 GitHub Pages。

## 本地运行

```bash
python -m http.server 8000
# 或
npx serve
```

然后访问 `http://localhost:8000`。由于使用 `fetch` 加载 JSON，不能直接双击 HTML 文件打开。

## 架构

```
index.html          # 首页：分类导航 + MOD 卡片网格 + 新闻侧栏 + 搜索
mod.html            # MOD 版本列表页（URL 参数: cat, mod）
detail.html         # 版本详情页（URL 参数: cat, mod, version），渲染富文本 HTML
admin.html          # 后台管理：分类/MOD/版本/新闻的 CRUD + 数据导出/导入
css/style.css       # 全局样式（CSS 变量定义在 :root）
js/data.js          # 数据模块：loadData(), saveData(), exportJSON(), importJSON(), genId(), getUrlParams(), showToast()
js/main.js          # 首页渲染逻辑
js/mod.js           # MOD 版本列表页逻辑
js/detail.js        # 详情页逻辑（富文本渲染 + 自动链接 URL）
js/admin.js         # 后台管理逻辑（admin 对象挂载到 window）
data/data.json      # 网站核心数据文件
```

## 数据流

- **`data.js`** 是共享数据层。所有页面的 `<script src="js/data.js">` 先加载。
- `loadData()` 优先从 `localStorage`（`san11_site_data` key）读取，fallback 到 `fetch('data/data.json')`。
- 后台（admin.html）的修改实时写入 `localStorage`（每次 onchange 调用 `saveData()`）。
- 用户在后台点"保存修改"按钮下载新的 `data.json` 和封面图片，手动替换仓库中的文件后 `git push` 完成部署更新。
- 页面间通过 URL 参数传递状态：`?cat=xxx&mod=xxx&version=xxx`。

## 数据结构

参见 `data/data.json`，顶层包含 `categories` 数组和 `news` 数组。每个 category 包含 `mods` 数组，每个 mod 包含 `versions` 数组。版本和新闻的 `content` 字段支持 HTML 标签。

## 注意事项

- 所有 JS 都是 IIFE 模式或挂载到 window（如 `admin` 对象、`loadData` 等函数），无模块系统。
- CSS 使用 `var(--xxx)` 变量系统，定义在 `:root` 中，主题为暖色仿古风格。
- 后台管理页的 `admin` 对象通过 `window.admin = admin` 暴露，供内联 `onclick`/`onchange` 调用。
- `data.js` 中的 `unescapeContent()` 用于修复被 `escape()` 双重转义的 HTML 内容。
