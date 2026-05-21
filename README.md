# CloudFlare-ImgBed (React Edition)

<div align="center">
    <p><em>🗂️ Open-source file hosting solution with a modern React + shadcn/ui frontend, supporting Docker and serverless deployment on Cloudflare Pages.</em></p>
    <p>
        <a href="README_zh.md">简体中文</a> | <a href="README.md">English</a>
    </p>
</div>

---

## About This Fork

This project is forked from [**MarSeventh/CloudFlare-ImgBed**](https://github.com/MarSeventh/CloudFlare-ImgBed) — a fantastic open-source file hosting solution. Huge thanks to [@MarSeventh](https://github.com/MarSeventh) and all contributors of the original project for their outstanding work!

The backend (Cloudflare Workers/Functions) and storage logic remain fully compatible with the upstream project. This fork focuses on **rewriting the frontend** with a modern tech stack.

## What's Different

| | Original | This Fork |
|---|---|---|
| **Frontend Framework** | Vue 3 + Element Plus | **React 18 + TypeScript** |
| **UI Library** | Element Plus | **shadcn/ui + Tailwind CSS** |
| **State Management** | Pinia | **Zustand** (with localStorage persist) |
| **Build Tool** | Vue CLI | **Vite** |
| **i18n** | vue-i18n | **react-i18next** |

### Highlights

- **Modern UI** — Clean, minimal design powered by shadcn/ui with full dark mode support
- **Type-safe** — Written entirely in TypeScript for better DX and fewer runtime errors
- **Lightweight** — Smaller bundle size with tree-shakeable components
- **Same backend** — Drop-in replacement; works with existing Cloudflare Pages/Workers deployment
- **i18n** — Built-in Chinese & English support

## Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build (outputs to frontend-dist/)
npm run build
```

Deploy to Cloudflare Pages with build output directory set to `frontend-dist`.

## Acknowledgements

- [MarSeventh/CloudFlare-ImgBed](https://github.com/MarSeventh/CloudFlare-ImgBed) — Original project (backend + Vue frontend)
- [MarSeventh/Sanyue-ImgHub](https://github.com/MarSeventh/Sanyue-ImgHub) — Original Vue frontend
- [cf-pages/Telegraph-Image](https://github.com/cf-pages/Telegraph-Image) — The pioneering project that started it all
- [shadcn/ui](https://ui.shadcn.com/) — Beautiful, accessible React components

## License

[MIT](LICENSE)
