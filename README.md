# house3d · 周湍淇住宅楼 3D 展示

「周湍淇住宅楼」的 Web 3D 展示站点，基于 Three.js。

- **根站（新版）**：Vite + React 19 + three.js 0.166.1 实时实景展示 —— 街道道路外景、全程序化纹理、昼夜系统、11 个平滑切换视角、可收起户型图卡片。源码在 `house3d-vite/`（本仓库 `v2` 为对应构建产物，现已提为根站）。
- **旧版（存档）**：原版逐层互动模型，保留在 `/v1/`。

## 在线访问

- 全屋室内全景与轻奢材质方案：**https://rossbool.github.io/house3d/panorama/**
- 单文件离线全景：[下载 HTML](https://github.com/RossBool/house3d/releases/download/offline-tour-2026-10-12/house3d-offline.html)（约 116 MB；下载完成后用桌面浏览器打开，无需本地服务器）。
- 新版实景展示：**https://rossbool.github.io/house3d/**
- 旧版逐层模型：https://rossbool.github.io/house3d/v1/

每次推送代码到 `main` 分支后，GitHub Pages 会自动重新构建（约 1 分钟内生效）。

## 本地预览（旧版 v1）

旧版页面使用了 ES Module（importmap），直接双击 `v1/index.html` 会被浏览器 CORS 拦截，需要起一个静态服务：

```bash
cd house3d
python3 -m http.server 8765
# 旧版 http://localhost:8765/v1/
```

## 目录结构

| 路径 | 说明 |
| --- | --- |
| `index.html` + `assets/` | 新版实景展示（Vite 构建产物） |
| `plans/` | 最新户型图（新版 UI 卡片引用） |
| `v1/` | 旧版逐层互动模型（index.html / app.js / data.js / libs / plans） |
| `notes-img/` | 户型相关图片 |
| `worker/` | 飞书数据同步代理（Cloudflare Worker，可选） |
| `panorama/` | 41 个新中式室内全景、原图浏览、1 张轻奢餐厨样图与 41 个区域的轻奢拟用材质说明 |

## 室内全景版本说明

出租标准层为 2–9 层的 A–E 五套独立公寓，共 21 个视点；10 层、11 层为自用住宅，分别有 13、7 个视点。当前 41 张全景为新中式版；轻奢调整保留原地板配色，现阶段提供一张餐厨样图及全屋材质方案，尚未生成完整高清轻奢图组。

全景和样图的实际原生尺寸均为 1774×887，未进行插值放大，不是原生 4K。材质说明为设计拟用规格与图像视觉判断，不是品牌型号认证或实物照片。离线 HTML 内嵌全部图片、JS 和 CSS；WebGL 不可用时，仍可通过“原图浏览”与“轻奢方案”入口查看内容。

## 部署

站点托管在 GitHub Pages，配置为 `main` 分支根目录。新版修改流程：在 `house3d-vite` 工程里 `npm run build`，把 `dist/` 内容复制到本仓库根目录提交推送。
