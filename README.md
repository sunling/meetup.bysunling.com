
# Meetup.bysunling.com

这是一个用于创建和管理线下活动（Meetup）的工具。  
目前部署在子域名：https://meetup.bysunling.com

---

## 📌 项目简介

本项目是一个独立的轻量化活动管理系统，提供以下功能：

- 创建活动
- 管理活动报名（RSVP）
- 活动信息展示
- 参与者报名与取消报名
- 简单的活动管理页面

---

## 📂 项目结构

```
├── netlify/functions/  # 所有后端 API 逻辑 (基于 Netlify Functions)
├── scripts/            # 前端用到的配置脚本
├── *.html              # 前端页面
├── netlify.toml        # Netlify 部署配置
├── package.json        # 项目依赖管理
└── README.md           # 项目说明文档
```

---

## 🚀 部署与开发

### 本地开发

需要先安装 Netlify CLI：

```bash
npm install -g netlify-cli
```

然后在项目目录下运行：

```bash
netlify dev
```

即可本地模拟完整的静态页面 + functions 环境。

### 部署

本项目通过 Netlify 自动部署。  
`netlify.toml` 中已经配置好静态目录与函数目录。

### 依赖安装

```bash
npm install
```

---

## 📄 License

本项目为个人项目，暂未设置开源协议。请联系作者获取使用许可。
