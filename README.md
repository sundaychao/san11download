# 三国志下载资源汇总

一个静态网站，用于汇总三国志系列游戏的 MOD、资源下载链接整理。

## 项目结构

```
san11Web/
├── index.html          # 首页
├── mod.html            # MOD版本列表页
├── detail.html         # 版本详情页
├── admin.html          # 后台管理页
├── css/
│   └── style.css       # 样式文件
├── js/
│   ├── data.js       # 数据管理模块
│   ├── main.js       # 首页逻辑
│   ├── mod.js        # MOD页逻辑
│   ├── detail.js     # 详情页逻辑
│   └── admin.js    # 后台管理逻辑
└── data/
    └── data.json     # 网站数据（分类、MOD、新闻
```

## 页面说明

### 1. 首页 (index.html)
- 左侧：游戏分类导航（三国志11、三国志9、三国志14等）
- 中间：当前分类下的 MOD 卡片网格
- 右侧：游戏新闻列表
- 顶部：搜索框

### 2. MOD页 (mod.html)
- 显示某个 MOD 的各版本列表

### 3. 详情页 (detail.html)
- 显示某个版本的详细富文本内容

### 4. 后台管理 (admin.html)
- **分类管理**：添加/修改/删除分类
- **MOD管理**：按分类添加/修改/删除 MOD
- **版本管理**：为每个 MOD 添加/修改/删除 版本，包括富文本内容
- **新闻管理**：添加/修改/删除新闻
- **数据导出**：导出 JSON 数据文件

## GitHub Pages 部署步骤

### 方式一：手动上传（最详细步骤

1. 在 GitHub 上创建一个新仓库（例如：san11-resources）

2. 将本项目所有文件上传到 GitHub 仓库中

3. 开启 GitHub Pages：
   - 进入仓库 Settings → Pages
   - Source 选择 `main` 分支，根目录 `/`
   - 等待几分钟后，页面会显示访问地址

4. 访问 `https://<你的用户名>.github.io/<仓库名>/

### 方式二：Git 命令行

```bash
# 1. 初始化 git
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

然后按上述步骤开启 GitHub Pages。

## 如何修改内容

### 在线编辑流程

1. 首先在浏览器中打开 `admin.html` 页面（例如：`https://<你的用户名>.github.io/<仓库名>/admin.html）

2. 在页面上进行修改：
   - 切换到"分类管理"Tab，添加、修改分类
   - 切换到"MOD管理"Tab，选择分类后添加、修改 MOD
   - 在 MOD 中添加版本，填写富文本内容
   - 切换到"新闻管理"Tab，添加、修改新闻

3. 修改完成后：
   - 切换到"数据导出/导入"Tab
   - 点击"导出 JSON"按钮，下载 `data.json` 文件

4. 将下载的 `data.json` 文件上传到 GitHub 仓库的 `data/` 目录下，替换原有文件

5. 等待 GitHub Pages 重新部署（约1-2分钟）

6. 刷新网站首页即可看到更新后的内容

### 本地预览

由于使用了 `fetch` API 加载 JSON，直接双击 HTML 文件可能因浏览器安全限制，建议使用本地服务器预览：

**Windows 可使用以下任一方式：

```bash
# 方式一：Python
python -m http.server 8000

# 方式二：Node.js (如已安装)
npx serve
```

然后访问 `http://localhost:8000`

## 富文本内容格式说明

版本详情支持 HTML 标签，可使用以下常用标签：

| 标签 | 效果 |
|------|------|
| `<h2>标题</h2> | 大标题 |
| `<h3>小标题</h3>` | 小标题 |
| `<p>段落文字</p>` | 段落 |
| `<strong>加粗文字</strong>` | 加粗 |
| `<ul><li>列表项1</li><li>列表项2</li></ul>` | 无序列表 |
| `<ol><li>列表项1</li><li>列表项2</li></ol>` | 有序列表 |
| `<a href="链接地址">链接文字</a>` | 超链接 |
| `<br>` | 换行 |

示例：

```html
<h2>血色衣冠 6.0 SP11</h2>
<p>这是一款经典的三国志11 MOD。</p>
<h3>主要特色</h3>
<ul>
    <li>特色一：详细介绍</li>
    <li>特色二：详细介绍</li>
</ul>
<p><strong>下载地址：</strong><a href="下载链接">点击下载</a></p>
```

## 数据结构说明

data.json 数据格式：

```json
{
  "categories": [
    {
      "id": "san11",
      "name": "三国志11",
      "mods": [
        {
          "id": "mod-id",
          "name": "MOD名称",
          "cover": "封面图片URL",
          "description": "简短描述",
          "versions": [
            {
              "id": "version-id",
              "name": "版本名称",
              "content": "<h2>富文本内容</h2>"
            }
          ]
        }
      ]
    }
  ],
  "news": [
    {
      "id": "news-id",
      "title": "新闻标题",
      "date": "2026-01-15",
      "content": "<p>新闻内容</p>"
    }
  ]
}
```

## 注意事项

1. 首次部署后大约需要 1-2 分钟才能看到更新内容
2. 修改内容后记得导出 JSON 并替换到 GitHub
3. 封面图片可以是完整的 URL 地址（可以是在线图片链接
4. 如果想清空本地编辑的内容，可以在后台页面点击"重置为默认"按钮

## 常见问题

**Q: 为什么修改后首页没有变化？**
A: 可能是浏览器缓存问题，尝试 Ctrl+F5 强制刷新。

**Q: 如何添加新的游戏分类？**
A: 进入 admin.html → "分类管理" Tab → 点击"+ 添加分类"按钮。

**Q: 富文本内容怎么写？**
A: 直接写 HTML 标签即可，简单的文本写在 `<p>` 标签中，标题用 `<h2>`/`<h3>`。

**Q: 可以添加图片吗？**
A: 可以的，富文本中使用 `<img src="图片URL">` 标签，图片需要自己托管。
