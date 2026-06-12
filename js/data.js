// 数据管理模块 - 负责加载、保存数据
const STORAGE_KEY = 'san11_site_data';

// 尝试从 IndexedDB 恢复目录句柄（无需用户手势）
async function _restoreFolderHandle() {
    if (window._dataDirHandle || !window.showDirectoryPicker) return;
    try {
        const handle = await new Promise((resolve) => {
            const req = indexedDB.open('san11-admin', 1);
            req.onupgradeneeded = () => { req.result.createObjectStore('handles'); };
            req.onsuccess = () => {
                const tx = req.result.transaction('handles', 'readonly');
                const getReq = tx.objectStore('handles').get('rootDir');
                getReq.onsuccess = () => { req.result.close(); resolve(getReq.result); };
                getReq.onerror = () => { req.result.close(); resolve(null); };
            };
            req.onerror = () => resolve(null);
        });
        if (!handle) return;
        const perm = await handle.queryPermission({ mode: 'readwrite' });
        if (perm === 'granted') {
            try { window._dataDirHandle = await handle.getDirectoryHandle('data'); } catch (e) {}
        }
    } catch (e) { /* 静默 */ }
}

// 修复被 escape() 双重转义的内容（&lt; → <, &gt; → > 等）
function unescapeContent(data) {
    if (!data || !data.categories) return data;
    const fix = (s) => {
        if (typeof s !== 'string') return s;
        // 若有转义痕迹，全部还原
        if (/&(lt|gt|amp|quot);/i.test(s)) {
            s = s.replace(/&amp;/g, '&');
            s = s.replace(/&lt;/g, '<');
            s = s.replace(/&gt;/g, '>');
            s = s.replace(/&quot;/g, '"');
        }
        return s;
    };
    data.categories.forEach(cat => {
        if (cat.mods) cat.mods.forEach(mod => {
            if (mod.versions) mod.versions.forEach(ver => {
                ver.content = fix(ver.content);
            });
        });
    });
    if (data.news) data.news.forEach(n => {
        n.content = fix(n.content);
    });
    return data;
}

// 从 JSON 文件加载数据（或从 localStorage 加载）
async function loadData() {
    await _restoreFolderHandle();  // 尝试恢复目录句柄，使 file:// 下也能直读磁盘

    // 1. 优先 fetch data.json（http:// 协议下可用）
    try {
        const url = 'data/data.json?_t=' + Date.now();
        const response = await fetch(url, { cache: 'no-store' });
        console.log('[loadData] fetch status:', response.status);
        if (response.ok) {
            const data = await response.json();
            console.log('[loadData] fetch 成功，categories:', data.categories?.length, 'news:', data.news?.length);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return data;
        }
    } catch (e) {
        console.warn('[loadData] fetch 失败:', e.message);
    }

    // 2. 通过 File System Access API 直读磁盘（file:// 或未启动 http server 时）
    if (window._dataDirHandle) {
        try {
            const fileHandle = await window._dataDirHandle.getFileHandle('data.json');
            const file = await fileHandle.getFile();
            const text = await file.text();
            const data = JSON.parse(text);
            console.log('[loadData] FileSystemAPI 成功，categories:', data.categories?.length, 'news:', data.news?.length);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return data;
        } catch (e) {
            console.error('[loadData] FileSystemAPI 失败:', e.message);
        }
    }

    // 3. Fallback: localStorage
    const localData = localStorage.getItem(STORAGE_KEY);
    console.log('[loadData] localStorage 有数据:', !!localData);
    if (localData) {
        try {
            const data = JSON.parse(localData);
            console.log('[loadData] 使用 localStorage，categories:', data.categories?.length);
            return unescapeContent(data);
        } catch (e) {
            console.error('[loadData] localStorage JSON 解析失败:', e);
        }
    }

    // 4. 最终默认
    console.warn('[loadData] 使用默认空数据');
    if (location.protocol === 'file:') {
        // file:// 协议下无法加载，显示醒目提示
        const banner = document.createElement('div');
        banner.style.cssText = 'background:#3C2F1E;color:#F0D78C;padding:18px 24px;text-align:center;font-size:15px;line-height:1.8;border-bottom:2px solid #B8860B;';
        banner.innerHTML = `
            <strong>无法加载数据</strong> — 你直接打开了 HTML 文件（file:// 协议），浏览器安全策略禁止读取本地 JSON。<br>
            请在项目目录下运行 <code style="background:#4A3B28;padding:2px 8px;border-radius:4px;">python -m http.server 8000</code>，
            然后访问 <code style="background:#4A3B28;padding:2px 8px;border-radius:4px;">http://localhost:8000/</code><br>
            或者在 <a href="admin.html" style="color:#B8860B;">后台管理</a> 中点击"📁 绑定项目文件夹"。
        `;
        document.body.prepend(banner);
    }
    return {
        categories: [{ id: 'san11', name: '三国志11', mods: [] }],
        news: []
    };
}

// 保存数据到 localStorage（仅后台使用）
function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 导出 JSON 数据文件（供用户手动替换）
function exportJSON(data) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
}

// 从 JSON 导入数据
function importJSON(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                resolve(data);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// 重置为默认数据（清除 localStorage）
function resetData() {
    localStorage.removeItem(STORAGE_KEY);
}

// 生成唯一 ID
function genId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// 获取 URL 参数
function getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');
    pairs.forEach(pair => {
        if (pair) {
            const [key, value] = pair.split('=');
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        }
    });
    return params;
}

// 显示提示消息
function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    if (isError) {
        toast.style.borderColor = '#ff7070';
        toast.style.color = '#ff7070';
    }
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}
