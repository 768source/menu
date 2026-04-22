// ============ 家的味道 · 家常菜谱 ============
const STORAGE_KEY = 'family_menu_custom_dishes_v1';
const DRAW_SEED_KEY = 'family_menu_daily_draw_seed_v1';

// 抽卡套餐结构：按卡槽定义每格应该从哪个分类里抽
const DRAW_SLOTS = [
    { slot: '主食', categoryIds: ['staple'] },
    { slot: '硬菜', categoryIds: ['big', 'couple'] },
    { slot: '小炒', categoryIds: ['quick', 'couple'] },
    { slot: '汤羹', categoryIds: ['soup'] }
];

class FamilyMenu {
    constructor() {
        this.data = null;          // 原始 JSON 数据
        this.customDishes = [];    // 用户自定义菜品（从 localStorage）
        this.keyword = '';
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.loadCustomDishes();
            this.renderSiteInfo();
            this.populateCategorySelect();
            this.renderDailyDraw();
            this.renderMenu();
            this.updateBrowseCount();
            this.bindEvents();
        } catch (err) {
            console.error('加载菜单数据失败:', err);
            this.showError('菜单数据加载失败，请刷新页面重试 🥲');
        }
    }

    // ---- 数据加载 ----
    async loadData() {
        const res = await fetch('menu.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        this.data = await res.json();
    }

    loadCustomDishes() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            this.customDishes = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(this.customDishes)) this.customDishes = [];
        } catch (e) {
            console.warn('读取本地自定义菜品失败，已重置:', e);
            this.customDishes = [];
        }
    }

    saveCustomDishes() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.customDishes));
        } catch (e) {
            console.error('保存到本地失败:', e);
            this.toast('保存失败，浏览器可能禁用了本地存储');
        }
    }

    /** 把自定义菜品按分类合并回 categories 列表，返回用于渲染的分组 */
    getMergedCategories() {
        // 深拷贝避免污染原始数据
        const merged = this.data.categories.map(cat => ({
            ...cat,
            dishes: [...cat.dishes]
        }));
        const catMap = new Map(merged.map(c => [c.id, c]));

        this.customDishes.forEach(d => {
            const cat = catMap.get(d.categoryId);
            if (cat) cat.dishes.push(d);
        });
        return merged;
    }

    // ---- 站点信息 ----
    renderSiteInfo() {
        const titleEl = document.getElementById('site-title');
        const subtitleEl = document.getElementById('site-subtitle');
        if (this.data.siteName) titleEl.textContent = this.data.siteName;
        if (this.data.subtitle) subtitleEl.textContent = this.data.subtitle;
    }

    // ---- 菜谱总数提示 ----
    updateBrowseCount() {
        const el = document.getElementById('browse-count');
        if (!el) return;
        const total = this.data.categories.reduce((s, c) => s + c.dishes.length, 0)
            + this.customDishes.length;
        el.textContent = `${total} 道`;
    }

    // ---- 浏览菜谱展开/收起 ----
    expandBrowse(scroll = true) {
        const section = document.getElementById('browse-section');
        const trigger = document.getElementById('browse-trigger-wrap');
        if (!section || !trigger) return;
        section.classList.remove('collapsed');
        section.classList.add('expanded');
        section.setAttribute('aria-hidden', 'false');
        trigger.classList.add('hidden');

        if (scroll) {
            setTimeout(() => {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 150);
        }
    }

    collapseBrowse() {
        const section = document.getElementById('browse-section');
        const trigger = document.getElementById('browse-trigger-wrap');
        if (!section || !trigger) return;
        section.classList.remove('expanded');
        section.classList.add('collapsed');
        section.setAttribute('aria-hidden', 'true');
        trigger.classList.remove('hidden');

        // 滚回抽卡区
        const draw = document.getElementById('daily-draw');
        if (draw) setTimeout(() => draw.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }

    // ---- 表单分类下拉 ----
    populateCategorySelect() {
        const sel = document.getElementById('add-category-select');
        sel.innerHTML = '';
        this.data.categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = `${cat.icon || ''} ${cat.name}`.trim();
            sel.appendChild(opt);
        });
    }

    // ---- 菜单主体 ----
    renderMenu() {
        const container = document.getElementById('menu-container');
        container.innerHTML = '';

        const kw = this.keyword.trim().toLowerCase();
        let totalMatch = 0;

        this.getMergedCategories().forEach(cat => {
            const dishes = cat.dishes.filter(d => this.matchDish(d, kw));
            if (dishes.length === 0) return;
            totalMatch += dishes.length;
            container.appendChild(this.createCategorySection(cat, dishes));
        });

        if (totalMatch === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="big-emoji">🍳</div>
                    <p>没找到相关菜品，换个关键词试试？</p>
                </div>
            `;
        }
    }

    matchDish(dish, kw) {
        if (!kw) return true;
        const hay = [
            dish.name,
            dish.difficulty,
            dish.time,
            ...(dish.tags || []),
            ...(dish.ingredients || [])
        ].join(' ').toLowerCase();
        return hay.includes(kw);
    }

    createCategorySection(cat, dishes) {
        const section = document.createElement('section');
        section.className = 'category-section';
        section.id = `cat-${cat.id}`;

        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `
            <span class="category-icon">${cat.icon || '🍽️'}</span>
            <h2 class="category-title">${this.escape(cat.name)}</h2>
            ${cat.desc ? `<span class="category-desc">${this.escape(cat.desc)}</span>` : ''}
        `;

        const grid = document.createElement('div');
        grid.className = 'dishes-grid';
        dishes.forEach(dish => grid.appendChild(this.createDishCard(dish)));

        section.appendChild(header);
        section.appendChild(grid);
        return section;
    }

    createDishCard(dish) {
        const card = document.createElement('article');
        card.className = 'dish-card';
        card.tabIndex = 0;
        card.dataset.dishId = dish.id;

        const tags = (dish.tags || []).slice(0, 3)
            .map(t => `<span class="tag">${this.escape(t)}</span>`).join('');

        const badge = dish.custom ? '<span class="badge-custom">我加的</span>' : '';

        card.innerHTML = `
            ${badge}
            <div class="dish-emoji">${dish.emoji || '🍽️'}</div>
            <div class="dish-body">
                <h3 class="dish-name">${this.escape(dish.name)}</h3>
                <div class="dish-meta">
                    ${dish.time ? `<span>⏱ ${this.escape(dish.time)}</span>` : ''}
                    ${dish.difficulty ? `<span>🎯 ${this.escape(dish.difficulty)}</span>` : ''}
                </div>
                <div class="dish-tags">${tags}</div>
            </div>
        `;

        card.addEventListener('click', () => this.openRecipe(dish));
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.openRecipe(dish);
            }
        });

        return card;
    }

    // ---- 菜谱详情弹窗 ----
    openRecipe(dish) {
        const modal = document.getElementById('recipe-modal');
        const body = document.getElementById('modal-body');

        const tags = (dish.tags || [])
            .map(t => `<span class="tag">${this.escape(t)}</span>`).join('');

        const ingredients = (dish.ingredients || [])
            .map(i => `<li>${this.escape(i)}</li>`).join('');

        const steps = (dish.steps || [])
            .map(s => `<li>${this.escape(s)}</li>`).join('');

        // 仅用户自定义的菜允许删除
        const deleteBtn = dish.custom
            ? `<button type="button" class="btn btn-danger" id="delete-dish-btn">🗑 删除这道菜</button>`
            : '';

        body.innerHTML = `
            <div class="recipe-hero">
                <span class="recipe-emoji">${dish.emoji || '🍽️'}</span>
                <h2>${this.escape(dish.name)}${dish.custom ? ' <span class="badge-custom" style="position:static;">我加的</span>' : ''}</h2>
                <div class="meta-row">
                    ${dish.time ? `<span>⏱ ${this.escape(dish.time)}</span>` : ''}
                    ${dish.difficulty ? `<span>🎯 ${this.escape(dish.difficulty)}</span>` : ''}
                </div>
                <div class="tags-row">${tags}</div>
            </div>
            <div class="recipe-body">
                ${ingredients ? `<h3>🧺 食材清单</h3><ul class="ingredients">${ingredients}</ul>` : '<p style="color:#999;">（未填写食材）</p>'}
                ${steps ? `<h3>👩‍🍳 做法步骤</h3><ol class="steps">${steps}</ol>` : ''}
            </div>
            ${deleteBtn ? `<div class="recipe-actions">${deleteBtn}</div>` : ''}
        `;

        // 绑定删除按钮
        if (dish.custom) {
            const btn = body.querySelector('#delete-dish-btn');
            btn.addEventListener('click', () => this.deleteCustomDish(dish.id));
        }

        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
    }

    closeRecipe() {
        const modal = document.getElementById('recipe-modal');
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        if (!this.isAnyModalOpen()) document.body.classList.remove('modal-open');
    }

    // ---- 添加菜品弹窗 ----
    openAddForm() {
        const modal = document.getElementById('add-modal');
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');

        // 自动聚焦菜名输入框
        setTimeout(() => {
            const nameInput = modal.querySelector('input[name="name"]');
            if (nameInput) nameInput.focus();
        }, 100);
    }

    closeAddForm() {
        const modal = document.getElementById('add-modal');
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        document.getElementById('add-form').reset();
        // 恢复默认表情
        const emojiInput = document.querySelector('#add-form input[name="emoji"]');
        if (emojiInput) emojiInput.value = '🍽️';
        if (!this.isAnyModalOpen()) document.body.classList.remove('modal-open');
    }

    isAnyModalOpen() {
        return document.querySelectorAll('.modal:not(.hidden)').length > 0;
    }

    handleAddSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const fd = new FormData(form);

        const name = (fd.get('name') || '').toString().trim();
        if (!name) {
            this.toast('请填写菜名');
            return;
        }

        const categoryId = (fd.get('categoryId') || '').toString();
        if (!categoryId) {
            this.toast('请选择所属分类');
            return;
        }

        const emoji = (fd.get('emoji') || '').toString().trim() || '🍽️';
        const time = (fd.get('time') || '').toString().trim();
        const difficulty = (fd.get('difficulty') || '').toString().trim();

        const tags = (fd.get('tags') || '').toString()
            .split(/[,，、;；]/)
            .map(s => s.trim())
            .filter(Boolean);

        const ingredients = (fd.get('ingredients') || '').toString()
            .split(/\r?\n/)
            .map(s => s.trim())
            .filter(Boolean);

        const steps = (fd.get('steps') || '').toString()
            .split(/\r?\n/)
            .map(s => s.trim())
            .filter(Boolean);

        const dish = {
            id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            custom: true,
            categoryId,
            name,
            emoji,
            time,
            difficulty,
            tags,
            ingredients,
            steps
        };

        this.customDishes.push(dish);
        this.saveCustomDishes();
        this.closeAddForm();
        this.renderMenu();
        this.updateBrowseCount();
        this.toast(`已添加「${name}」🎉`);

        // 自动展开浏览区并滚动到对应分类
        this.expandBrowse(false);
        setTimeout(() => {
            const target = document.getElementById(`cat-${categoryId}`);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 250);
    }

    deleteCustomDish(id) {
        const dish = this.customDishes.find(d => d.id === id);
        if (!dish) return;
        if (!confirm(`确定要删除「${dish.name}」吗？此操作无法撤销。`)) return;

        this.customDishes = this.customDishes.filter(d => d.id !== id);
        this.saveCustomDishes();
        this.closeRecipe();
        this.renderMenu();
        this.updateBrowseCount();
        this.toast(`已删除「${dish.name}」`);
    }

    // ---- 事件绑定 ----
    bindEvents() {
        // 搜索（防抖）
        const input = document.getElementById('search-input');
        let t = null;
        input.addEventListener('input', e => {
            clearTimeout(t);
            t = setTimeout(() => {
                this.keyword = e.target.value;
                this.renderMenu();
            }, 150);
        });

        // 菜谱详情弹窗关闭
        document.getElementById('recipe-modal')
            .querySelectorAll('[data-close]')
            .forEach(el => el.addEventListener('click', () => this.closeRecipe()));

        // 添加按钮
        document.getElementById('fab-add')
            .addEventListener('click', () => this.openAddForm());

        // 添加表单弹窗关闭
        document.getElementById('add-modal')
            .querySelectorAll('[data-close-add]')
            .forEach(el => el.addEventListener('click', () => this.closeAddForm()));

        // 表单提交
        document.getElementById('add-form')
            .addEventListener('submit', e => this.handleAddSubmit(e));

        // ESC 关闭所有弹窗
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                this.closeRecipe();
                this.closeAddForm();
            }
        });

        // 再摇一次
        const redrawBtn = document.getElementById('btn-redraw');
        if (redrawBtn) {
            redrawBtn.addEventListener('click', () => this.redraw());
        }

        // 浏览完整菜谱
        const browseBtn = document.getElementById('btn-browse-more');
        if (browseBtn) {
            browseBtn.addEventListener('click', () => this.expandBrowse(true));
        }

        // 收起
        const collapseBtn = document.getElementById('btn-collapse');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => this.collapseBrowse());
        }
    }

    // ====================================================
    // 今日抽卡
    // ====================================================

    /** 今日日期 key：yyyy-mm-dd */
    todayKey() {
        const d = new Date();
        const p = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    }

    /** 基于字符串的可预测伪随机数生成器（mulberry32 + 简易哈希） */
    seededRandom(seedStr) {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < seedStr.length; i++) {
            h ^= seedStr.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        let a = h >>> 0;
        return function() {
            a |= 0; a = a + 0x6D2B79F5 | 0;
            let t = Math.imul(a ^ a >>> 15, 1 | a);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    /** 读取/生成当天的种子；同一天同一种子，换天自动变 */
    getTodaySeed() {
        const today = this.todayKey();
        let cache = null;
        try {
            const raw = localStorage.getItem(DRAW_SEED_KEY);
            if (raw) cache = JSON.parse(raw);
        } catch { /* ignore */ }

        if (cache && cache.date === today && typeof cache.seed === 'string') {
            return cache.seed;
        }
        const seed = `${today}-${Math.random().toString(36).slice(2, 10)}`;
        try {
            localStorage.setItem(DRAW_SEED_KEY, JSON.stringify({ date: today, seed }));
        } catch { /* ignore */ }
        return seed;
    }

    /** 强制生成新种子（再摇一次） */
    regenerateSeed() {
        const today = this.todayKey();
        const seed = `${today}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        try {
            localStorage.setItem(DRAW_SEED_KEY, JSON.stringify({ date: today, seed }));
        } catch { /* ignore */ }
        return seed;
    }

    /** 抽一桌菜，返回每个卡槽对应的菜品 */
    drawMeal(seed) {
        const rand = this.seededRandom(seed);
        const merged = this.getMergedCategories();
        const catMap = new Map(merged.map(c => [c.id, c]));
        const usedIds = new Set();

        const picks = DRAW_SLOTS.map(slot => {
            // 收集此卡槽可用的候选菜
            const pool = [];
            slot.categoryIds.forEach(cid => {
                const cat = catMap.get(cid);
                if (!cat) return;
                cat.dishes.forEach(d => {
                    if (!usedIds.has(d.id)) pool.push(d);
                });
            });
            if (pool.length === 0) return { slot: slot.slot, dish: null };

            // 二人食加权：带 "二人食" 标签的菜品双倍命中
            const weighted = [];
            pool.forEach(d => {
                const w = (d.tags || []).includes('二人食') ? 2 : 1;
                for (let i = 0; i < w; i++) weighted.push(d);
            });

            const picked = weighted[Math.floor(rand() * weighted.length)];
            usedIds.add(picked.id);
            return { slot: slot.slot, dish: picked };
        });

        return picks;
    }

    /** 渲染今日抽卡区块（首次进入：卡背；点击或已翻则正面） */
    renderDailyDraw() {
        const seed = this.getTodaySeed();
        this.currentDraw = this.drawMeal(seed);

        // 日期展示
        const dateEl = document.getElementById('draw-date');
        if (dateEl) {
            const today = this.todayKey();
            const weekday = ['周日','周一','周二','周三','周四','周五','周六'][new Date().getDay()];
            dateEl.textContent = `${today} · ${weekday} — 点击卡片翻牌`;
        }

        // 渲染卡片
        const container = document.getElementById('draw-cards');
        if (!container) return;
        container.innerHTML = '';

        this.currentDraw.forEach(item => {
            const card = this.createFlipCard(item);
            container.appendChild(card);
        });

        this.renderDrawSummary(false);
    }

    createFlipCard({ slot, dish }) {
        const card = document.createElement('div');
        card.className = 'flip-card';
        card.tabIndex = 0;

        if (!dish) {
            card.innerHTML = `
                <div class="flip-back">—</div>
                <div class="flip-inner">
                    <div class="flip-slot">${this.escape(slot)}</div>
                    <div class="flip-emoji">🤷</div>
                    <div class="flip-body">
                        <div class="flip-name">菜品不足</div>
                        <div class="flip-meta">添加更多菜后再抽</div>
                    </div>
                </div>
            `;
            return card;
        }

        card.innerHTML = `
            <div class="flip-back">${this.escape(slot)}</div>
            <div class="flip-inner">
                <div class="flip-slot">${this.escape(slot)}</div>
                <div class="flip-emoji">${dish.emoji || '🍽️'}</div>
                <div class="flip-body">
                    <div class="flip-name">${this.escape(dish.name)}</div>
                    <div class="flip-meta">
                        ${dish.time ? `⏱ ${this.escape(dish.time)}` : ''}
                        ${dish.difficulty ? ` · ${this.escape(dish.difficulty)}` : ''}
                    </div>
                </div>
            </div>
        `;

        let flipped = false;
        const toggleOrOpen = () => {
            if (!flipped) {
                card.classList.add('flipped');
                flipped = true;
                // 检查是否全部翻开
                setTimeout(() => this.checkAllFlipped(), 400);
            } else {
                this.openRecipe(dish);
            }
        };
        card.addEventListener('click', toggleOrOpen);
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleOrOpen();
            }
        });

        return card;
    }

    checkAllFlipped() {
        const all = Array.from(document.querySelectorAll('#draw-cards .flip-card'));
        if (all.length === 0) return;
        const allFlipped = all.every(c => c.classList.contains('flipped'));
        if (allFlipped) {
            this.renderDrawSummary(true);
            // 高亮一下“浏览完整菜谱”按钮，提示用户可以看更多
            const trigger = document.getElementById('browse-trigger-wrap');
            if (trigger && !trigger.classList.contains('hidden')) {
                trigger.style.animation = 'none';
                void trigger.offsetWidth;
                trigger.style.animation = 'pulse 1.2s ease 2';
            }
        }
    }

    renderDrawSummary(reveal) {
        const el = document.getElementById('draw-summary');
        if (!el) return;
        if (!reveal || !this.currentDraw) {
            el.classList.add('hidden');
            el.innerHTML = '';
            return;
        }
        const list = this.currentDraw
            .filter(x => x.dish)
            .map(x => `<b>${this.escape(x.slot)}</b>「${this.escape(x.dish.name)}」`)
            .join(' · ');
        el.classList.remove('hidden');
        el.innerHTML = `🎉 今日两人食：${list}`;
    }

    /** 再摇一次：生成新种子、抖动动画、翻回背面再翻开 */
    redraw() {
        const cards = Array.from(document.querySelectorAll('#draw-cards .flip-card'));

        // 先抖动
        cards.forEach(c => {
            c.classList.remove('shaking');
            void c.offsetWidth; // reflow
            c.classList.add('shaking');
        });

        // 先全部翻回去
        setTimeout(() => {
            cards.forEach(c => c.classList.remove('flipped'));
        }, 300);

        // 再生成新内容并重新渲染
        setTimeout(() => {
            this.regenerateSeed();
            this.renderDailyDraw();
            this.toast('🎲 已重新抽取今日菜单');
        }, 700);
    }

    // ---- 轻提示 ----
    toast(msg) {
        const old = document.querySelector('.toast');
        if (old) old.remove();
        const el = document.createElement('div');
        el.className = 'toast';
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2200);
    }

    // ---- 工具 ----
    escape(str) {
        return String(str ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    showError(msg) {
        const container = document.getElementById('menu-container');
        container.innerHTML = `
            <div class="empty-state">
                <div class="big-emoji">😵</div>
                <p>${this.escape(msg)}</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => new FamilyMenu());