// 首页逻辑 - 渲染分类、mod卡片、新闻
let siteData = null;
let currentCategoryId = null;

// 初始化页面
async function initPage() {
    siteData = await loadData();

    // 默认选中第一个分类
    if (siteData.categories && siteData.categories.length > 0) {
        currentCategoryId = siteData.categories[0].id;
    }

    renderCategories();
    renderMods();
    renderNews();
    initSearch();
}

// 渲染分类导航
function renderCategories() {
    const nav = document.getElementById('categoryNav');
    if (!siteData.categories || siteData.categories.length === 0) {
        nav.innerHTML = '<div style="padding:20px; color:var(--text-secondary); font-size:13px;">暂无分类</div>';
        return;
    }

    nav.innerHTML = siteData.categories.map(cat => `
        <div class="category-item ${cat.id === currentCategoryId ? 'active' : ''}" data-id="${cat.id}">
            ${cat.name}
        </div>
    `).join('');

    // 绑定点击事件
    nav.querySelectorAll('.category-item').forEach(el => {
        el.addEventListener('click', () => {
            currentCategoryId = el.dataset.id;
            renderCategories();
            renderMods();
        });
    });
}

// 渲染 mod 卡片
function renderMods(filterKeyword = '') {
    const grid = document.getElementById('modGrid');
    const category = siteData.categories.find(c => c.id === currentCategoryId);

    if (!category || !category.mods || category.mods.length === 0) {
        grid.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-secondary);">该分类下暂无mod</div>';
        return;
    }

    // 搜索过滤
    let mods = category.mods;
    if (filterKeyword) {
        const keyword = filterKeyword.toLowerCase();
        mods = mods.filter(m =>
            m.name.toLowerCase().includes(keyword) ||
            (m.description && m.description.toLowerCase().includes(keyword))
        );
    }

    if (mods.length === 0) {
        grid.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-secondary);">未找到匹配的mod</div>';
        return;
    }

    grid.innerHTML = mods.map(mod => {
        const firstChar = mod.name.charAt(0) || '?';
        const hasCover = mod.cover && mod.cover.trim() !== '';

        if (hasCover) {
            return `
                <div class="mod-card mod-card-cover-bg" data-mod-id="${mod.id}" style="background-image: url('${mod.cover}');">
                    <div class="mod-card-overlay">
                        <div class="mod-card-title">${mod.name}</div>
                        <div class="mod-card-desc">${mod.description || ''}</div>
                    </div>
                </div>
            `;
        }
        return `
            <div class="mod-card" data-mod-id="${mod.id}">
                <div class="mod-card-cover">${firstChar}</div>
                <div class="mod-card-title">${mod.name}</div>
                <div class="mod-card-desc">${mod.description || ''}</div>
            </div>
        `;
    }).join('');

    // 绑定点击事件
    grid.querySelectorAll('.mod-card').forEach(card => {
        card.addEventListener('click', () => {
            const modId = card.dataset.modId;
            window.location.href = `mod.html?cat=${currentCategoryId}&mod=${modId}`;
        });
    });
}

// 渲染新闻
function renderNews() {
    const list = document.getElementById('newsList');
    if (!siteData.news || siteData.news.length === 0) {
        list.innerHTML = '<div style="color:var(--text-secondary); font-size:13px;">暂无新闻</div>';
        return;
    }

    list.innerHTML = siteData.news.slice(0, 10).map(news => `
        <div class="news-item" data-news-id="${news.id}">
            <span class="news-item-title">${news.title}</span>
        </div>
    `).join('');

    list.querySelectorAll('.news-item').forEach(el => {
        el.addEventListener('click', () => {
            const news = siteData.news.find(n => n.id === el.dataset.newsId);
            if (news) openNewsDetail(news.title, news.content);
        });
    });
}

// 搜索功能
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        renderMods(e.target.value);
    });
}

// 页面加载
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}
