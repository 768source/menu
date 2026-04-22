# 家庭菜单使用说明

这是一个简单的家庭电子菜单网页应用，可以在线查看家庭菜品信息。

## 🍽️ 功能特点

- 📱 响应式设计，支持手机、平板、电脑
- 🎨 简洁美观的界面设计
- 📋 按分类展示菜品信息
- 🔄 通过修改数据文件轻松更新菜单

## 📁 项目结构

```
menu/
├── index.html          # 主页面文件
├── style.css           # 样式文件
├── script.js           # 功能脚本
├── menu.json          # 菜单数据文件
├── vercel.json        # 部署配置文件
└── README.md          # 使用说明
```

## 🔧 如何修改菜单

### 1. 修改菜品数据

编辑 `menu.json` 文件来更新菜单内容：

```json
{
  "restaurantName": "家庭厨房",
  "categories": [
    {
      "id": "main",
      "name": "主食",
      "dishes": [
        {
          "id": "fried-rice",
          "name": "蛋炒饭",
          "price": 15,
          "description": "香喷喷的蛋炒饭，配料丰富"
        }
      ]
    }
  ]
}
```

### 2. 数据结构说明

- `restaurantName`: 餐厅/家庭名称
- `categories`: 菜品分类数组
  - `id`: 分类唯一标识
  - `name`: 分类名称
  - `dishes`: 菜品数组
    - `id`: 菜品唯一标识
    - `name`: 菜品名称
    - `price`: 价格（数字）
    - `description`: 菜品描述（可选）

### 3. 添加新菜品

在对应的分类下添加新的菜品对象：

```json
{
  "id": "new-dish",
  "name": "新菜品名称",
  "price": 25,
  "description": "菜品描述"
}
```

## 🌐 在线部署

### 方法一：使用 Vercel（推荐）

1. 访问 [vercel.com](https://vercel.com)
2. 注册账号并登录
3. 点击 "Import Project"
4. 选择 GitHub 仓库或直接上传项目文件
5. 等待部署完成，获得在线链接

### 方法二：使用 GitHub Pages

1. 将项目上传到 GitHub 仓库
2. 在仓库设置中启用 GitHub Pages
3. 选择主分支作为发布源
4. 获得 `https://用户名.github.io/仓库名` 的链接

## 📱 访问方式

部署完成后，您将获得一个类似这样的链接：
- `https://family-menu.vercel.app`
- `https://用户名.github.io/family-menu`

将此链接分享给家人，即可在任意设备上查看菜单。

## 🎨 自定义样式

如需修改界面样式，可编辑 `style.css` 文件：

- 修改颜色主题
- 调整字体大小
- 更改布局样式

## 🔍 本地测试

在部署前可先本地测试：

```bash
# 在项目目录下运行
python -m http.server 8000
# 然后在浏览器访问 http://localhost:8000
```

## 📞 技术支持

如有问题，请检查：

1. 数据文件格式是否正确（JSON格式）
2. 所有文件是否在同一目录下
3. 浏览器控制台是否有错误信息

---

**祝您使用愉快！** 🍽️