
[![Netlify Status](https://api.netlify.com/api/v1/badges/3e5410c5-379f-4fa4-a9cf-d97d033efa0a/deploy-status)](https://app.netlify.com/projects/ins-meetup/deploys)

# Meetup.bysunling.com

一个用于快速发起线上线下活动的小工具。  
🌐 **在线访问：** https://meetup.bysunling.com

---

## 📌 项目简介

本项目是一个基于 Netlify Functions 的全栈活动管理系统，采用前后端分离架构，提供完整的活动创建、管理和参与功能。

### ✨ 核心功能

- 🎯 **活动创建** - 支持创建线上/线下活动，包含详细信息和图片上传
- 📋 **活动管理** - 活动审核、编辑、删除等管理功能
- 👥 **报名系统** - 参与者报名（RSVP）、取消报名、人数统计
- 📱 **二维码分享** - 自动生成活动二维码，便于分享
- 🔐 **权限管理** - 基于令牌的活动管理权限控制
- 📊 **数据统计** - 活动参与情况统计和管理

---

## 📂 项目结构

```
├── netlify/
│   └── functions/          # 后端 API (Netlify Functions)
│       ├── approveMeetup.js      # 活动审核
│       ├── createMeetup.js       # 创建活动
│       ├── deleteRsvp.js         # 取消报名
│       ├── getMeetupDetails.js   # 获取活动详情
│       ├── listAllMeetups.js     # 获取所有活动（管理员）
│       ├── listMeetups.js        # 获取活动列表
│       ├── submitRsvp.js         # 提交报名
│       ├── updateMeetup.js       # 更新活动
│       └── uploadImageToGitHub.js # 图片上传
├── scripts/                # 前端工具脚本
│   ├── apiWithCache.js           # API 缓存管理
│   ├── cacheManager.js           # 缓存工具
│   ├── gradientConfig.js         # 渐变配置
│   └── timeUtils.js              # 时间工具
├── styles/
│   └── shared.css              # 共享样式
├── user_uploads/               # 用户上传文件目录
├── index.html                  # 活动列表页面
├── new-meetup.html            # 创建活动页面
├── meetup.html                # 活动详情页面
├── manage.html                # 活动管理页面
├── admin.html                 # 管理员审核页面
├── logo.svg                   # 网站Logo
├── netlify.toml              # Netlify 部署配置
├── package.json              # 项目依赖管理
└── README.md                 # 项目说明文档
```

## 🎨 页面功能

| 页面 | 功能描述 |
|------|----------|
| `index.html` | 活动列表展示，支持筛选和搜索 |
| `new-meetup.html` | 创建新活动，包含表单验证和图片上传 |
| `meetup.html` | 活动详情展示和报名功能 |
| `manage.html` | 活动创建者管理界面，查看报名情况 |
| `admin.html` | 管理员审核界面，批量管理活动 |

## 🔧 技术栈

### 前端
- **HTML5 + CSS3** - 响应式设计，支持移动端
- **原生 JavaScript** - 无框架依赖，轻量化实现
- **渐变设计** - 多巴胺配色方案，现代化UI

### 后端
- **Netlify Functions** - Serverless 架构
- **Supabase** - 数据库和认证服务
- **Node.js** - 运行时环境

### 主要依赖
- `@supabase/supabase-js` - Supabase 客户端
- `bcryptjs` - 密码加密
- `jsonwebtoken` - JWT 令牌管理
- `luxon` - 时间处理
- `node-fetch` - HTTP 请求

---

## 🚀 快速开始

### 环境要求
- Node.js 16+
- Netlify CLI
- Supabase 账户（用于数据库）

### 本地开发

### 环境变量配置

在项目根目录创建 `.env` 文件，配置以下环境变量：

```env
# Supabase 配置
SUPABASE_ANON_KEY=your_supabase_anon_key

# GitHub 配置（用于图片上传）
GITHUB_TOKEN=your_github_token
GITHUB_REPO_OWNER=your_github_username
GITHUB_REPO_NAME=your_repo_name
GITHUB_BRANCH=main

# 管理员配置
ADMIN_TOKEN=your_admin_token

# OpenRouter API 配置（用于AI生成分享文案）
OPENROUTER_API_KEY=your_openrouter_api_key
```

> **注意：** `.env` 文件已在 `.gitignore` 中，不会被提交到代码仓库。

1. **克隆项目**
```bash
git clone https://github.com/your-username/meetup.bysunling.com.git
cd meetup.bysunling.com
```

2. **安装依赖**
```bash
npm install
```

3. **安装 Netlify CLI**
```bash
npm install -g netlify-cli
```

4. **配置环境变量**
创建 `.env` 文件并配置以下变量：
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
GITHUB_TOKEN=your_github_token
GITHUB_REPO=your_github_repo
```

5. **启动开发服务器**
```bash
npm run dev
# 或者
netlify dev
```

访问 `http://localhost:8888` 查看应用。

### 部署

本项目支持 Netlify 一键部署：

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/meetup.bysunling.com)

或手动部署：
1. Fork 本仓库
2. 在 Netlify 中连接你的 GitHub 仓库
3. 配置环境变量
4. 部署完成

## 📋 API 接口

### 活动管理
- `POST /api/createMeetup` - 创建活动
- `GET /api/listMeetups` - 获取活动列表
- `GET /api/getMeetupDetails` - 获取活动详情
- `PUT /api/updateMeetup` - 更新活动
- `POST /api/approveMeetup` - 审核活动

### 报名管理
- `POST /api/submitRsvp` - 提交报名
- `DELETE /api/deleteRsvp` - 取消报名

### 文件上传
- `POST /api/uploadImageToGitHub` - 上传图片到 GitHub

### 管理功能
- `GET /api/listAllMeetups` - 获取所有活动（管理员）

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发规范
- 遵循现有代码风格
- 提交前请测试功能
- 提供清晰的提交信息

## 📞 联系方式

- 作者：Ling Sun
- 项目地址：https://github.com/your-username/meetup.bysunling.com
- 在线演示：https://meetup.bysunling.com

## 📄 License

ISC License - 详见 [LICENSE](LICENSE) 文件

---

⭐ 如果这个项目对你有帮助，请给个 Star！
