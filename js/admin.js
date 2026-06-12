// 后台管理逻辑 - 管理分类、MOD、新闻
const admin = {
    data: null,

    async init() {
        await this.restoreProjectFolder();  // 先恢复目录句柄，loadData 需要用它直读磁盘
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
            this._modCardsExpanded = null;
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
            this._autoSaveJSON();
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
            this._autoSaveJSON();
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
            this._autoSaveJSON();
            showToast('已添加新新闻，已自动保存');
        });

        // 顶部操作按钮（已精简，仅保留内联 onclick）
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

        // 记住当前展开状态，重绘后恢复
        const expandedState = new Map();
        if (this._modCardsExpanded) {
            this._modCardsExpanded.forEach((v, k) => expandedState.set(k, v));
        } else {
            container.querySelectorAll('.mod-edit-card').forEach((card, i) => {
                const body = card.querySelector('.mod-edit-body');
                if (body && !body.classList.contains('collapsed')) {
                    expandedState.set(i, true);
                }
            });
        }

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
                    <h3>${mod.name} <span class="toggle-icon ${expandedState.get(modIdx) ? '' : 'collapsed'}">${expandedState.get(modIdx) ? '▼' : '▶'}</span></h3>
                    <div class="item-actions" onclick="event.stopPropagation()">
                        <button onclick="admin.deleteMod(${modIdx})" class="delete-btn">删除</button>
                    </div>
                </div>
                <div class="mod-edit-body ${expandedState.get(modIdx) ? '' : 'collapsed'}">
                <div class="form-group">
                    <label>MOD名称</label>
                    <input type="text" value="${this.escape(mod.name)}" onchange="admin.updateMod(${modIdx}, 'name', this.value)">
                </div>
                <div class="form-group">
                    <label>封面图片（推荐：放入 images/ 文件夹，填写路径如 images/cover.jpg。上传按钮仅用于临时预览）</label>
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
        this._autoSaveJSON();
    },

    updateCategoryId(idx, value) {
        this.data.categories[idx].id = value;
        this.renderJsonPreview();
        saveData(this.data);
        this._autoSaveJSON();
    },

    deleteCategory(idx) {
        if (confirm(`确定要删除分类"${this.data.categories[idx].name}"及其下所有MOD吗？`)) {
            this.data.categories.splice(idx, 1);
            this.renderAll();
            saveData(this.data);
            this._autoSaveJSON();
            showToast('已删除');
        }
    },

    // ---- MOD操作 ----
    updateMod(modIdx, field, value) {
        const catId = document.getElementById('modCategorySelect').value;
        const category = this.data.categories.find(c => c.id === catId);
        category.mods[modIdx][field] = value;
        if (field === 'cover') {
            const previewImg = document.querySelector(`.mod-edit-card:nth-child(${modIdx + 1}) .cover-preview img`);
            if (previewImg) {
                if (value) { previewImg.src = value; previewImg.style.display = ''; }
                else previewImg.style.display = 'none';
            }
        }
        this.renderJsonPreview();
        saveData(this.data);
        this._autoSaveJSON();
    },

    deleteMod(modIdx) {
        const catId = document.getElementById('modCategorySelect').value;
        const category = this.data.categories.find(c => c.id === catId);
        if (confirm(`确定要删除MOD"${category.mods[modIdx].name}"及其所有版本吗？`)) {
            category.mods.splice(modIdx, 1);
            this.renderAll();
            saveData(this.data);
            this._autoSaveJSON();
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
        this._autoSaveJSON();
        showToast('已添加版本');
    },

    updateVersion(modIdx, verIdx, field, value) {
        const catId = document.getElementById('modCategorySelect').value;
        const category = this.data.categories.find(c => c.id === catId);
        category.mods[modIdx].versions[verIdx][field] = value;
        this.renderJsonPreview();
        saveData(this.data);
        this._autoSaveJSON();
    },

    deleteVersion(modIdx, verIdx) {
        const catId = document.getElementById('modCategorySelect').value;
        const category = this.data.categories.find(c => c.id === catId);
        if (confirm(`确定要删除版本"${category.mods[modIdx].versions[verIdx].name}"吗？`)) {
            category.mods[modIdx].versions.splice(verIdx, 1);
            this.renderModManager();
            this.renderJsonPreview();
            saveData(this.data);
            this._autoSaveJSON();
            showToast('已删除');
        }
    },

    // ---- 新闻操作 ----
    updateNews(idx, field, value) {
        this.data.news[idx][field] = value;
        this.renderJsonPreview();
        saveData(this.data);
        this._autoSaveJSON();
    },

    deleteNews(idx) {
        if (confirm(`确定要删除新闻"${this.data.news[idx].title}"吗？`)) {
            this.data.news.splice(idx, 1);
            this.renderAll();
            saveData(this.data);
            this._autoSaveJSON();
            showToast('已删除');
        }
    },

    // ---- 数据保存（下载 data.json + 所有图片） ----

    // 绑定文件夹后自动防抖写入 data.json，避免清缓存丢失
    _autoSaveJSON() {
        if (!this.dataDirHandle) return;
        if (this._autoSaveTimer) clearTimeout(this._autoSaveTimer);
        this._autoSaveTimer = setTimeout(async () => {
            const jsonBlob = new Blob([JSON.stringify(this.data, null, 2)], { type: 'application/json' });
            try {
                const fileHandle = await this.dataDirHandle.getFileHandle('data.json', { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(jsonBlob);
                await writable.close();
            } catch (e) { /* 静默失败，手动保存时有提示 */ }
        }, 800);
    },
    async saveAll() {
        if (this._autoSaveTimer) clearTimeout(this._autoSaveTimer);
        this.syncAllInputs();
        saveData(this.data);

        if (this.dataDirHandle) {
            // 直接写入本地文件夹
            await this.writeToLocal();
        } else {
            // 未绑定文件夹，fallback 到下载方式
            const jsonBlob = new Blob([JSON.stringify(this.data, null, 2)], { type: 'application/json' });
            this.triggerDownload(jsonBlob, 'data.json');
            this.downloadBase64Images();
            showToast('已下载 data.json 和封面图片，请拖入对应文件夹后 git push');
        }
        this.renderJsonPreview();
    },

    async writeToLocal() {
        // 写入 data.json
        const jsonBlob = new Blob([JSON.stringify(this.data, null, 2)], { type: 'application/json' });
        const dataFileHandle = await this.dataDirHandle.getFileHandle('data.json', { create: true });
        const dataWritable = await dataFileHandle.createWritable();
        await dataWritable.write(jsonBlob);
        await dataWritable.close();

        // 写入 base64 封面图到 images/ 文件夹
        let imageCount = 0;
        for (const cat of this.data.categories) {
            if (!cat.mods) continue;
            for (const mod of cat.mods) {
                if (!mod.cover || !mod.cover.startsWith('data:image/')) continue;
                const match = mod.cover.match(/^data:image\/(\w+)/);
                const ext = match ? match[1].replace('jpeg', 'jpg') : 'jpg';
                const safeName = (mod.name || 'cover').replace(/[\/\\:*?"<>|]/g, '_') + '.' + ext;
                const arr = mod.cover.split(',');
                const mime = arr[0].match(/data:(image\/\w+)/)[1];
                const blob = this.base64ToBlob(arr[1], mime);

                if (this.imagesDirHandle) {
                    try {
                        const imgFileHandle = await this.imagesDirHandle.getFileHandle(safeName, { create: true });
                        const imgWritable = await imgFileHandle.createWritable();
                        await imgWritable.write(blob);
                        await imgWritable.close();
                    } catch (e) {
                        this.triggerDownload(blob, safeName);
                    }
                } else {
                    this.triggerDownload(blob, safeName);
                }
                mod.cover = 'images/' + safeName;
                imageCount++;
            }
        }
        // 更新封面路径后重新写一次 data.json
        const finalJsonBlob = new Blob([JSON.stringify(this.data, null, 2)], { type: 'application/json' });
        const finalFileHandle = await this.dataDirHandle.getFileHandle('data.json', { create: true });
        const finalWritable = await finalFileHandle.createWritable();
        await finalWritable.write(finalJsonBlob);
        await finalWritable.close();

        saveData(this.data);
        showToast(`已保存到本地：data/data.json${imageCount > 0 ? ' + ' + imageCount + ' 张封面图' : ''}`);
    },

    downloadBase64Images() {
        this.data.categories.forEach(cat => {
            if (!cat.mods) return;
            cat.mods.forEach(mod => {
                if (!mod.cover || !mod.cover.startsWith('data:image/')) return;
                const match = mod.cover.match(/^data:image\/(\w+)/);
                const ext = match ? match[1].replace('jpeg', 'jpg') : 'jpg';
                const safeName = (mod.name || 'cover').replace(/[\/\\:*?"<>|]/g, '_') + '.' + ext;
                const arr = mod.cover.split(',');
                const mime = arr[0].match(/data:(image\/\w+)/)[1];
                const blob = this.base64ToBlob(arr[1], mime);
                this.triggerDownload(blob, safeName);
                mod.cover = 'images/' + safeName;
            });
        });
    },

    base64ToBlob(base64, mime) {
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        return new Blob([bytes], { type: mime });
    },

    triggerDownload(blob, filename) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 200);
    },

    resetData() {
        if (confirm('确定要重置为默认数据吗？所有修改将丢失，需要重新加载页面。')) {
            resetData();
            showToast('已重置，请刷新页面');
            setTimeout(() => location.reload(), 1000);
        }
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
        // 记住展开状态，防止重绘时丢失
        if (!this._modCardsExpanded) this._modCardsExpanded = new Map();
        this._modCardsExpanded.set(modIdx, isCollapsed);
    },

    // 绑定项目根文件夹（一次绑定，保存数据和图片都直接写入）
    async bindProjectFolder() {
        if (!window.showDirectoryPicker) {
            showToast('需要 Chrome/Edge 浏览器才支持直接保存到本地文件夹', true);
            return;
        }
        try {
            this.rootDirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
            await this.setupSubDirHandles();
            await this.storeFolderHandle();
            const name = this.rootDirHandle.name;
            showToast('已绑定项目文件夹：' + name + ' — 保存和上传都直接写入本地！');
        } catch (e) {
            if (e.name !== 'AbortError') {
                showToast('绑定失败：' + e.message, true);
            }
        }
    },

    async setupSubDirHandles() {
        try { this.dataDirHandle = await this.rootDirHandle.getDirectoryHandle('data'); }
        catch { showToast('未找到 data/ 子目录，将使用下载方式导出 JSON', true); }
        try { this.imagesDirHandle = await this.rootDirHandle.getDirectoryHandle('images'); }
        catch { showToast('未找到 images/ 子目录，上传图片将触发下载', true); }
        // 暴露给 data.js，使 loadData() 可直接从磁盘读取
        window._dataDirHandle = this.dataDirHandle;
    },

    // 将目录句柄持久化到 IndexedDB，下次打开页面自动恢复
    async storeFolderHandle() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open('san11-admin', 1);
            req.onupgradeneeded = () => {
                req.result.createObjectStore('handles');
            };
            req.onsuccess = () => {
                const tx = req.result.transaction('handles', 'readwrite');
                tx.objectStore('handles').put(this.rootDirHandle, 'rootDir');
                tx.oncomplete = () => { req.result.close(); resolve(); };
                tx.onerror = () => reject(tx.error);
            };
            req.onerror = () => reject(req.error);
        });
    },

    // 页面加载时自动恢复之前绑定的文件夹
    async restoreProjectFolder() {
        if (!window.showDirectoryPicker) return;
        const handle = await new Promise((resolve) => {
            const req = indexedDB.open('san11-admin', 1);
            req.onupgradeneeded = () => {
                req.result.createObjectStore('handles');
            };
            req.onsuccess = () => {
                const tx = req.result.transaction('handles', 'readonly');
                const getReq = tx.objectStore('handles').get('rootDir');
                getReq.onsuccess = () => { req.result.close(); resolve(getReq.result); };
                getReq.onerror = () => { req.result.close(); resolve(null); };
            };
            req.onerror = () => resolve(null);
        });
        if (!handle) return;

        // 检查权限是否仍然有效
        const opts = { mode: 'readwrite' };
        const perm = await handle.queryPermission(opts);
        if (perm === 'granted') {
            this.rootDirHandle = handle;
            await this.setupSubDirHandles();
        } else {
            // 尝试重新请求权限（需用户手势，这里静默失败）
            this.rootDirHandle = null;
        }
    },

    // 封面图片上传：若已绑定文件夹则直接写入 images/，否则 base64 暂存
    async handleCoverUpload(modIdx, inputEl) {
        const file = inputEl.files[0];
        if (!file) return;

        const catId = document.getElementById('modCategorySelect').value;
        const category = this.data.categories.find(c => c.id === catId);

        if (this.imagesDirHandle) {
            // 已绑定文件夹：直接写入 images/ 目录
            try {
                const ext = file.name.split('.').pop() || 'jpg';
                const safeName = (category.mods[modIdx].name || 'cover').replace(/[\/\\:*?"<>|]/g, '_') + '.' + ext;
                const imgFileHandle = await this.imagesDirHandle.getFileHandle(safeName, { create: true });
                const writable = await imgFileHandle.createWritable();
                await writable.write(file);
                await writable.close();
                category.mods[modIdx].cover = 'images/' + safeName;
                saveData(this.data);
                this.renderModManager();
                this.renderJsonPreview();
                showToast('图片已保存到 images/' + safeName);
            } catch (e) {
                showToast('写入图片失败：' + e.message, true);
            }
        } else {
            // 未绑定文件夹：base64 暂存到 localStorage
            const reader = new FileReader();
            reader.onload = (e) => {
                category.mods[modIdx].cover = e.target.result;
                this.renderModManager();
                this.renderJsonPreview();
                saveData(this.data);
                showToast('图片已加载（预览中），绑定项目文件夹后保存可直接写入本地');
            };
            reader.readAsDataURL(file);
        }
    },
};

// 挂到 window，使内联 onchange/onclick 能访问 admin
window.admin = admin;

// 初始化：脚本在 body 底部，直接执行；若 DOM 尚未就绪则监听
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => admin.init());
} else {
    admin.init();
}
