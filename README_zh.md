# CloudFlare-ImgBed (React 版)

<div align="center">
    <p><em>🗂️ 基于 React + shadcn/ui 重写前端的开源文件托管方案，支持 Docker 和 Cloudflare Pages 无服务器部署。</em></p>
    <p>
        <a href="README_zh.md">简体中文</a> | <a href="README.md">English</a>
    </p>
</div>

---

## 关于本 Fork

本项目 fork 自 [**MarSeventh/CloudFlare-ImgBed**](https://github.com/MarSeventh/CloudFlare-ImgBed) —— 一个优秀的开源文件托管解决方案。感谢 [@MarSeventh](https://github.com/MarSeventh) 及所有原项目贡献者的杰出工作！

后端（Cloudflare Workers/Functions）和存储逻辑与上游项目完全兼容。本 fork 专注于使用现代技术栈**重写前端**。

## 有什么不同

| | 原版 | 本 Fork |
|---|---|---|
| **前端框架** | Vue 3 + Element Plus | **React 18 + TypeScript** |
| **UI 组件库** | Element Plus | **shadcn/ui + Tailwind CSS** |
| **状态管理** | Pinia | **Zustand**（支持 localStorage 持久化） |
| **构建工具** | Vue CLI | **Vite** |
| **国际化** | vue-i18n | **react-i18next** |

### 特色

- **现代化 UI** — 基于 shadcn/ui 的简洁设计，完整支持深色模式
- **类型安全** — 全面使用 TypeScript，更好的开发体验，更少的运行时错误
- **轻量化** — 更小的打包体积，组件支持 tree-shaking
- **无缝替换** — 后端完全兼容，可直接替换现有 Cloudflare Pages/Workers 部署
- **国际化** — 内置中英文支持

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建（输出至 frontend-dist/）
npm run build
```

部署至 Cloudflare Pages 时，构建输出目录设置为 `frontend-dist`。

## 致谢

- [MarSeventh/CloudFlare-ImgBed](https://github.com/MarSeventh/CloudFlare-ImgBed) — 原始项目（后端 + Vue 前端）
- [MarSeventh/Sanyue-ImgHub](https://github.com/MarSeventh/Sanyue-ImgHub) — 原始 Vue 前端
- [cf-pages/Telegraph-Image](https://github.com/cf-pages/Telegraph-Image) — 最初的开创性项目
- [shadcn/ui](https://ui.shadcn.com/) — 美观、可访问的 React 组件库

## 许可证

[MIT](LICENSE)
