// 数据管理模块 - 负责加载、保存数据
const STORAGE_KEY = 'san11_site_data';

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
    // 首先尝试从 localStorage 加载（后台编辑的数据）
    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
        try {
            const data = JSON.parse(localData);
            return unescapeContent(data);
        } catch (e) {
            console.error('解析本地数据失败:', e);
        }
    }

    // 如果 localStorage 没有数据，从 JSON 文件加载
    try {
        const response = await fetch('data/data.json');
        if (!response.ok) throw new Error('加载失败');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('加载数据失败:', error);
        // 返回默认数据
        return {
            categories: [{ id: 'san11', name: '三国志11', mods: [] }],
            news: []
        };
    }
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
