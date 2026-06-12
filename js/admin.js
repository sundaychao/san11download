// 后台管理逻辑 - 管理分类、MOD、新闻
const admin = {
    data: null,

    async init() {
        this.data = await loadData();
        this.bindEvents();
        this.renderAll();
    },

    bindEvents() {
        // Tab 切换
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
            });
        });

        // 分类下拉框切换
        const select = document.getElementById('modCategorySelect');
        select.addEventListener('change', () => {
            this.renderModManager();
        });

        // 添加分类
        document.getElementById('addCategoryBtn').addEventListener('click', () => {
            if (!this.data.categories) this.data.categories = [];
            const newCat = {
                id: genId('cat'),
                name: '新分类',
                mods: []
            };
            this.data.categories.push(newCat);
            this.renderAll();
            saveData(this.data);
            showToast('已添加新分类，已自动保存');
        });

        // 添加MOD
        document.getElementById('addModBtn').addEventListener('click', () => {
            const catId = document.getElementById('modCategorySelect').value;
            const category = this.data.categories.find(c => c.id === catId);
            if (!category) {
                showToast('请先选择分类', true);
                return;
            }
            if (!category.mods) category.mods = [];
            category.mods.push({
                id: genId('mod'),
                name: '新MOD',
                cover: '',
                description: '简短描述',
                versions: []
            });
            this.renderAll();
            saveData(this.data);
            showToast('已添加新MOD，已自动保存');
        });

        // 添加新闻
        document.getElementById('addNewsBtn').addEventListener('click', () => {
            if (!this.data.news) this.data.news = [];
            this.data.news.unshift({
                id: genId('news'),
                title: '新新闻标题',
                date: new Date().toISOString().split('T')[0],
                content: '<p>新闻内容...</p>'
            });
            this.renderAll();
            saveData(this.data);
            showToast('已添加新新闻，已自动保存');
        });

        // 顶部操作按钮
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
        document.getElementById('importFile').addEventListener('change', (e) => this.importFile(e));
        document.getElementById('resetBtn').addEventListener('click', () => {
            if (confirm('确定要重置为默认数据吗？所有修改将丢失。')) {
                resetData();
                location.reload();
            }
        });

        // 底部导入
        document.getElementById('importFileInput').addEventListener('change', (e) => this.importFile(e));
    },

    renderAll() {
        this.renderCategories();
        this.renderCategorySelect();
        this.renderModManager();
        this.renderNewsManager();
        this.renderJsonPreview();
    },

    renderCategories() {
        const container = document.getElementById('categoryManager');
        if (!this.data.categories || this.data.categories.length === 0) {
            container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-secondary);">暂无分类</div>';
            return;
        }

        container.innerHTML = this.data.categories.map((cat, idx) => `
            <div class="category-edit-item">
                <div class="mod-edit-header">
                    <h3>分类 #${idx + 1}</h3>
                    <div class="item-actions">
                        <button onclick="admin.deleteCategory(${idx})" class="delete-btn">删除</button>
                    </div>
                </div>
                <div class="form-group">
                    <label>分类名称</label>
                    <input type="text" value="${this.escape(cat.name)}" onchange="admin.updateCategoryName(${idx}, this.value)">
                </div>
                <div class="form-group">
                    <label>分类ID（唯一标识，一般无需修改）</label>
                    <input type="text" value="${cat.id}" onchange="admin.updateCategoryId(${idx}, this.value)">
                </div>
            </div>
        `).join('');
    },

    renderCategorySelect() {
        const select = document.getElementById('modCategorySelect');
        const currentId = select.value;
        select.innerHTML = this.data.categories.map(cat =>
            `<option value="${cat.id}" ${cat.id === currentId ? 'selected' : ''}>${cat.name}</option>`
        ).join('');
    },

    renderModManager() {
        const catId = document.getElementById('modCategorySelect').value;
        const category = this.data.categories.find(c => c.id === catId);
        const container = document.getElementById('modManager');

        if (!category) {
            container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-secondary);">请先选择分类</div>';
            return;
        }

        if (!category.mods || category.mods.length === 0) {
            container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-secondary);">该分类下暂无MOD，请点击下方按钮添加</div>';
            return;
        }

        container.innerHTML = category.mods.map((mod, modIdx) => `
            <div class="mod-edit-card">
                <div class="mod-edit-header" onclick="admin.toggleMod(${modIdx})">
                    <h3>${mod.name} <span class="toggle-icon collapsed">▶</span></h3>
                    <div class="item-actions" onclick="event.stopPropagation()">
                        <button onclick="admin.deleteMod(${modIdx})" class="delete-btn">删除</button>
                    </div>
                </div>
                <div class="mod-edit-body collapsed">
                <div class="form-group">
                    <label>MOD名称</label>
                    <input type="text" value="${this.escape(mod.name)}" onchange="admin.updateMod(${modIdx}, 'name', this.value)">
                </div>
                <div class="form-group">
                    <label>封面图片（本地路径如 images/cover.jpg，或外部URL，留空显示文字Logo）</label>
                    <div class="cover-input-row">
                        <input type="text" value="${mod.cover || ''}" onchange="admin.updateMod(${modIdx}, 'cover', this.value)" placeholder="images/xxx.jpg 或 https://...">
                        <label class="admin-btn upload-btn">
                            📁 选择图片
                            <input type="file" accept="image/*" onchange="admin.handleCoverUpload(${modIdx}, this)" style="display:none">
                        </label>
                    </div>
                    ${mod.cover ? `<div class="cover-preview"><img src="${mod.cover}" alt="封面预览" onerror="this.style.display='none'"></div>` : ''}
                </div>
                <div class="form-group">
                    <label>简短描述</label>
                    <input type="text" value="${this.escape(mod.description || '')}" onchange="admin.updateMod(${modIdx}, 'description', this.value)">
                </div>
                <div class="versions-list">
                    <div style="color:var(--text-secondary); font-size:14px; margin-bottom:12px;">版本列表</div>
                    ${mod.versions && mod.versions.length > 0 ? mod.versions.map((ver, verIdx) => `
                        <div class="version-edit-item">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                <strong>版本 #${verIdx + 1}</strong>
                                <div class="item-actions">
                                    <button onclick="admin.deleteVersion(${modIdx}, ${verIdx})" class="delete-btn">删除</button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>版本名称</label>
                                <input type="text" value="${this.escape(ver.name)}" onchange="admin.updateVersion(${modIdx}, ${verIdx}, 'name', this.value)">
                            </div>
                            <div class="form-group rich-editor">
                                <label>详细内容（支持HTML标签，如 &lt;h2&gt;标题&lt;/h2&gt;、&lt;p&gt;段落&lt;/p&gt;、&lt;strong&gt;加粗&lt;/strong&gt;、&lt;ul&gt;&lt;li&gt;列表项&lt;/li&gt;&lt;/ul&gt;、&lt;a href="链接"&gt;下载&lt;/a&gt; 等）</label>
                                <textarea rows="10" oninput="admin.updateVersion(${modIdx}, ${verIdx}, 'content', this.value)">${ver.content || ''}</textarea>
                            </div>
                        </div>
                    `).join('') : '<div style="color:var(--text-secondary); font-size:13px; padding:12px; text-align:center;">暂无版本</div>'}
                    <div style="text-align:center; margin-top:12px;">
                        <button class="admin-btn" onclick="admin.addVersion(${modIdx})">+ 添加版本</button>
                    </div>
                </div>
                </div>
            </div>
        `).join('');
    },

    renderNewsManager() {
        const container = document.getElementById('newsManager');
        if (!this.data.news || this.data.news.length === 0) {
            container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-secondary);">暂无新闻</div>';
            return;
        }

        container.innerHTML = this.data.news.map((news, idx) => `
            <div class="news-edit-item">
                <div class="mod-edit-header">
                    <h3>新闻 #${idx + 1}</h3>
                    <div class="item-actions">
                        <button onclick="admin.deleteNews(${idx})" class="delete-btn">删除</button>
                    </div>
                </div>
                <div class="form-group">
                    <label>标题</label>
                    <input type="text" value="${this.escape(news.title)}" onchange="admin.updateNews(${idx}, 'title', this.value)">
                </div>
                <div class="form-group">
                    <label>日期（格式：YYYY-MM-DD）</label>
                    <input type="text" value="${news.date || ''}" onchange="admin.updateNews(${idx}, 'date', this.value)">
                </div>
                <div class="form-group rich-editor">
                    <label>内容（支持HTML标签）</label>
                    <textarea rows="6" onchange="admin.updateNews(${idx}, 'content', this.value)">${news.content || ''}</textarea>
                </div>
            </div>
        `).join('');
    },

    renderJsonPreview() {
        document.getElementById('jsonPreview').textContent = JSON.stringify(this.data, null, 2);
    },

    // ---- 分类操作 ----
    updateCategoryName(idx, value) {
        this.data.categories[idx].name = value;
        this.renderCategorySelect();
        this.renderJsonPreview();
        saveData(this.data);
    },

    updateCategoryId(idx, value) {
        this.data.categories[idx].id = value;
        this.renderJsonPreview();
        saveData(this.data);
    },

    deleteCategory(idx) {
        if (confirm(`确定要删除分类"${this.data.categories[idx].name}"及其下所有MOD吗？`)) {
            this.data.categories.splice(idx, 1);
            this.renderAll();
            saveData(this.data);
            showToast('已删除');
        }
    },

    // ---- MOD操作 ----
    updateMod(modIdx, field, value) {
        const catId = document.getElementById('modCategorySelect').value;
        const category = this.data.categories.find(c => c.id === catId);
        category.mods[modIdx][field] = value;
        this.renderModManager();
        this.renderJsonPreview();
        saveData(this.data);
    },

    deleteMod(modIdx) {
        const catId = document.getElementById('modCategorySelect').value;
        const category = this.data.categories.find(c => c.id === catId);
        if (confirm(`确定要删除MOD"${category.mods[modIdx].name}"及其所有版本吗？`)) {
            category.mods.splice(modIdx, 1);
            this.renderAll();
            saveData(this.data);
            showToast('已删除');
        }
    },

    addVersion(modIdx) {
        const catId = document.getElementById('modCategorySelect').value;
        const category = this.data.categories.find(c => c.id === catId);
        if (!category.mods[modIdx].versions) category.mods[modIdx].versions = [];
        category.mods[modIdx].versions.push({
            id: genId('ver'),
            name: '新版本',
            content: '<h2>新版本</h2><p>内容描述...</p>'
        });
        this.renderModManager();
        this.renderJsonPreview();
        saveData(this.data);
        showToast('已添加版本');
    },

    updateVersion(modIdx, verIdx, field, value) {
        const catId = document.getElementById('modCategorySelect').value;
        const category = this.data.categories.find(c => c.id === catId);
        category.mods[modIdx].versions[verIdx][field] = value;
        this.renderJsonPreview();
        saveData(this.data);
    },

    deleteVersion(modIdx, verIdx) {
        const catId = document.getElementById('modCategorySelect').value;
        const category = this.data.categories.find(c => c.id === catId);
        if (confirm(`确定要删除版本"${category.mods[modIdx].versions[verIdx].name}"吗？`)) {
            category.mods[modIdx].versions.splice(verIdx, 1);
            this.renderModManager();
            this.renderJsonPreview();
            saveData(this.data);
            showToast('已删除');
        }
    },

    // ---- 新闻操作 ----
    updateNews(idx, field, value) {
        this.data.news[idx][field] = value;
        this.renderJsonPreview();
        saveData(this.data);
    },

    deleteNews(idx) {
        if (confirm(`确定要删除新闻"${this.data.news[idx].title}"吗？`)) {
            this.data.news.splice(idx, 1);
            this.renderAll();
            saveData(this.data);
            showToast('已删除');
        }
    },

    // ---- 数据导出/导入 ----
    saveAll() {
        this.syncAllInputs();
        saveData(this.data);
        showToast('已保存到本地浏览器');
    },

    exportData() {
        this.syncAllInputs();
        saveData(this.data);
        exportJSON(this.data);
        showToast('数据已导出为 data.json');
    },

    // 同步所有输入框的当前值到 data（防止 onchange 未触发）
    syncAllInputs() {
        const cards = document.querySelectorAll('.mod-edit-card');
        cards.forEach(card => {
            const inputs = card.querySelectorAll('input[type=text], textarea');
            inputs.forEach(input => {
                input.dispatchEvent(new Event('change', { bubbles: true }));
            });
        });
        // 也同步新闻编辑区的输入框
        const newsItems = document.querySelectorAll('.news-edit-item');
        newsItems.forEach(item => {
            const inputs = item.querySelectorAll('input[type=text], textarea');
            inputs.forEach(input => {
                input.dispatchEvent(new Event('change', { bubbles: true }));
            });
        });
    },

    async importFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        try {
            const data = await importJSON(file);
            if (data.categories && Array.isArray(data.categories)) {
                this.data = data;
                saveData(data);
                this.renderAll();
                showToast('导入成功！');
            } else {
                showToast('文件格式不正确', true);
            }
        } catch (e) {
            showToast('导入失败：' + e.message, true);
        }
        event.target.value = '';
    },

    resetData() {
        if (confirm('确定要重置为默认数据吗？所有修改将丢失，需要重新加载页面。')) {
            resetData();
            showToast('已重置，请刷新页面');
            setTimeout(() => location.reload(), 1000);
        }
    },

    // 工具函数
    escape(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    },

    // 展开/收起 MOD 编辑区
    toggleMod(modIdx) {
        const card = document.querySelectorAll('.mod-edit-card')[modIdx];
        if (!card) return;
        const body = card.querySelector('.mod-edit-body');
        const icon = card.querySelector('.toggle-icon');
        if (!body || !icon) return;
        const isCollapsed = body.classList.contains('collapsed');
        if (isCollapsed) {
            body.classList.remove('collapsed');
            icon.classList.remove('collapsed');
            icon.textContent = '▼';
        } else {
            body.classList.add('collapsed');
            icon.classList.add('collapsed');
            icon.textContent = '▶';
        }
    },

    // 封面图片上传处理：转为 base64 暂存到 localStorage
    handleCoverUpload(modIdx, inputEl) {
        const file = inputEl.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Url = e.target.result;
            const catId = document.getElementById('modCategorySelect').value;
            const category = this.data.categories.find(c => c.id === catId);
            category.mods[modIdx].cover = base64Url;
            this.renderModManager();
            this.renderJsonPreview();
            saveData(this.data);
            showToast('封面图片已上传（base64），发布时建议替换为本地路径');
        };
        reader.readAsDataURL(file);
    }
};

// 挂到 window，使内联 onchange/onclick 能访问 admin
window.admin = admin;

// 初始化：脚本在 body 底部，直接执行；若 DOM 尚未就绪则监听
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => admin.init());
} else {
    admin.init();
}
