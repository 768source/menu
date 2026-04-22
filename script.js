// 家庭菜单应用
class FamilyMenu {
    constructor() {
        this.menuData = null;
        this.init();
    }

    // 初始化应用
    async init() {
        try {
            // 加载菜单数据
            await this.loadMenuData();
            // 渲染菜单
            this.renderMenu();
        } catch (error) {
            console.error('加载菜单数据失败:', error);
            this.showError('无法加载菜单数据，请刷新页面重试');
        }
    }

    // 加载菜单数据
    async loadMenuData() {
        const response = await fetch('menu.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        this.menuData = await response.json();
    }

    // 渲染菜单
    renderMenu() {
        const container = document.getElementById('menu-container');
        
        // 清空容器
        container.innerHTML = '';
        
        // 渲染每个分类
        this.menuData.categories.forEach(category => {
            const categorySection = this.createCategorySection(category);
            container.appendChild(categorySection);
        });
    }

    // 创建分类区块
    createCategorySection(category) {
        const section = document.createElement('section');
        section.className = 'category-section';
        
        // 分类标题
        const title = document.createElement('h2');
        title.className = 'category-title';
        title.textContent = category.name;
        
        // 菜品网格
        const grid = document.createElement('div');
        grid.className = 'dishes-grid';
        
        // 添加菜品卡片
        category.dishes.forEach(dish => {
            const card = this.createDishCard(dish);
            grid.appendChild(card);
        });
        
        section.appendChild(title);
        section.appendChild(grid);
        
        return section;
    }

    // 创建菜品卡片
    createDishCard(dish) {
        const card = document.createElement('div');
        card.className = 'dish-card';
        
        const name = document.createElement('h3');
        name.className = 'dish-name';
        name.textContent = dish.name;
        
        const price = document.createElement('p');
        price.className = 'dish-price';
        price.textContent = `¥${dish.price}`;
        
        // 如果有描述，添加描述
        if (dish.description) {
            const description = document.createElement('p');
            description.className = 'dish-description';
            description.textContent = dish.description;
            card.appendChild(description);
        }
        
        card.appendChild(name);
        card.appendChild(price);
        
        return card;
    }

    // 显示错误信息
    showError(message) {
        const container = document.getElementById('menu-container');
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <p>${message}</p>
            </div>
        `;
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new FamilyMenu();
});