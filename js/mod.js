// mod页面逻辑 - 显示版本列表
let siteData = null;
let currentCategoryId = null;
let currentModId = null;

async function initPage() {
    siteData = await loadData();
    const params = getUrlParams();
    currentCategoryId = params.cat || siteData.categories[0].id;

    // 尝试获取mod信息
    const category = siteData.categories.find(c => c.id === currentCategoryId);

    // 如果URL没有mod参数，使用第一个mod
    currentModId = params.mod || (category.mods && category.mods[0] && category.mods[0].id);

    renderCategories();
    renderNews();

    if (!currentModId) {
        document.getElementById('contentArea').innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-secondary);">未找到对应mod</div>';
        return;
    }

    renderBreadcrumb();
    renderVersions();
}

// 渲染分类导航
function renderCategories() {
    const nav = document.getElementById('categoryNav');
    nav.innerHTML = siteData.categories.map(cat => `
        <div class="category-item ${cat.id === currentCategoryId ? 'active' : ''}" data-id="${cat.id}">
            ${cat.name}
        </div>
    `).join('');

    nav.querySelectorAll('.category-item').forEach(el => {
        el.addEventListener('click', () => {
            const catId = el.dataset.id;
            const cat = siteData.categories.find(c => c.id === catId);
            if (cat && cat.mods && cat.mods.length > 0) {
                window.location.href = `mod.html?cat=${catId}&mod=${cat.mods[0].id}`;
            } else {
                window.location.href = `mod.html?cat=${catId}`;
            }
        });
    });
}

// 渲染面包屑
function renderBreadcrumb() {
    const category = siteData.categories.find(c => c.id === currentCategoryId);
    const mod = category.mods.find(m => m.id === currentModId);
    if (!category || !mod) return;

    document.getElementById('breadcrumb').innerHTML = `
        <a href="index.html">首页</a>
        <span class="breadcrumb-separator">></span>
        <a href="index.html?cat=${currentCategoryId}">${category.name}</a>
        <span class="breadcrumb-separator">></span>
        <span>${mod.name}</span>
    `;
}

// 渲染版本列表
function renderVersions() {
    const category = siteData.categories.find(c => c.id === currentCategoryId);
    const mod = category.mods.find(m => m.id === currentModId);
    const list = document.getElementById('versionList');

    if (!mod || !mod.versions || mod.versions.length === 0) {
        list.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-secondary);">该mod暂无版本</div>';
        return;
    }

    list.innerHTML = `
        <h2 style="color:var(--accent-cyan); font-size:22px; margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid var(--border-color);">${mod.name}</h2>
        ${mod.versions.map((version, idx) => `
            <div class="version-item" data-version-id="${version.id}">
                <div class="version-title">${version.name}</div>
                <div class="version-arrow">→</div>
            </div>
        `).join('')}
    `;

    // 绑定点击事件
    list.querySelectorAll('.version-item').forEach(el => {
        el.addEventListener('click', () => {
            const versionId = el.dataset.versionId;
            window.location.href = `detail.html?cat=${currentCategoryId}&mod=${currentModId}&version=${versionId}`;
        });
    });
}

// 渲染新闻
function renderNews() {
    const list = document.getElementById('newsList');
    if (!siteData.news || siteData.news.length === 0) return;
    list.innerHTML = siteData.news.slice(0, 10).map(news => `
        <div class="news-item">
            <div class="news-item-title">${news.title}</div>
            <div class="news-item-date">${news.date || ''}</div>
        </div>
    `).join('');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}
