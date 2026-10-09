# house3d · 住宅户型 3D 互动模型

「周湍淇住宅楼 · 九层平面（26.900）」的 Web 3D 互动模型，基于 Three.js，可在浏览器中旋转、缩放、逐层查看户型。

## 在线访问

**https://rossbool.github.io/house3d/**

每次推送代码到 `main` 分支后，GitHub Pages 会自动重新构建（约 1 分钟内生效）。

## 本地预览

页面使用了 ES Module（importmap），直接双击 `index.html` 会被浏览器 CORS 拦截，需要起一个静态服务：

```bash
cd house3d
python3 -m http.server 8765
# 打开 http://localhost:8765/
```

或者用 Node：

```bash
npx serve .
```

## 目录结构

| 路径 | 说明 |
| --- | --- |
| `index.html` | 页面入口，含楼层切换器与全部样式 |
| `app.js` | 3D 场景、交互与渲染逻辑 |
| `data.js` | 户型数据（墙体、门窗、楼层平面等） |
| `libs/` | 本地化的 Three.js 与 OrbitControls |
| `notes-img/` | 户型相关图片 |
| `worker/` | 飞书数据同步代理（Cloudflare Worker，可选） |

## 部署

站点托管在 GitHub Pages，配置为 `main` 分支根目录，无需额外构建步骤。
