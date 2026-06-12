// 详情页面逻辑 - 显示版本的富文本内容
let siteData = null;
let currentCategoryId = null;
let currentModId = null;
let currentVersionId = null;

async function initPage() {
    siteData = await loadData();
    const params = getUrlParams();
    currentCategoryId = params.cat;
    currentModId = params.mod;
    currentVersionId = params.version;

    renderCategories();
    renderBreadcrumb();
    renderDetail();
    renderNews();
}

function renderCategories() {
    const nav = document.getElementById('categoryNav');
    nav.innerHTML = siteData.categories.map(cat => `
        <div class="category-item ${cat.id === currentCategoryId ? 'active' : ''}" data-id="${cat.id}">
            ${cat.name}
        </div>
    `).join('');

    nav.querySelectorAll('.category-item').forEach(el => {
        el.addEventListener('click', () => {
            window.location.href = `index.html?cat=${el.dataset.id}`;
        });
    });
}

function renderBreadcrumb() {
    const category = siteData.categories.find(c => c.id === currentCategoryId);
    const mod = category && category.mods.find(m => m.id === currentModId);
    const version = mod && mod.versions && mod.versions.find(v => v.id === currentVersionId);

    if (!category || !mod || !version) return;

    document.getElementById('breadcrumb').innerHTML = `
        <a href="index.html">首页</a>
        <span class="breadcrumb-separator">></span>
        <a href="mod.html?cat=${currentCategoryId}&mod=${currentModId}" style="color:var(--text-secondary);">${category.name}</a>
        <span class="breadcrumb-separator">></span>
        <a href="mod.html?cat=${currentCategoryId}&mod=${currentModId}" style="color:var(--text-secondary);">${mod.name}</a>
        <span class="breadcrumb-separator">></span>
        <span>${version.name}</span>
    `;
}

function renderDetail() {
    const category = siteData.categories.find(c => c.id === currentCategoryId);
    const mod = category && category.mods.find(m => m.id === currentModId);
    const version = mod && mod.versions && mod.versions.find(v => v.id === currentVersionId);

    const content = document.getElementById('detailContent');

    if (!category || !mod || !version) {
        content.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-secondary);">未找到对应内容</div>';
        return;
    }

    // 渲染富文本内容
    let html = version.content || '';
    if (!html.trim()) {
        content.innerHTML = '<p style="color:var(--text-secondary);">暂无内容</p>';
        return;
    }
    // 如果内容不含 HTML 标签，自动用 <p> 包裹换行
    if (!/<[a-zA-Z][^>]*>/.test(html)) {
        html = html.split('\n').filter(line => line.trim()).map(line => `<p>${line}</p>`).join('');
    }
    // 自动将纯文本 URL 转为可点击链接
    html = html.replace(/(?<!["'>=\w])(https?:\/\/[^\s<>\[\]()]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    content.innerHTML = html;

    // 所有链接新窗口打开
    content.querySelectorAll('a').forEach(a => {
        if (!a.target) a.target = '_blank';
        a.rel = 'noopener noreferrer';
    });
}

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
