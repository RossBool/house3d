# 意式现代全景入口

独立静态目录，部署后路径为 `/house3d/italian/`。既有 `/house3d/panorama/` 保留。

当前 VR 可浏览 **41/41** 个视点：2–9层五套独立出租公寓及公共走道21个、10层自用住宅13个、11层自用住宅7个。`standard_02`（A起居）为3840×1920 PNG；其余40个为内置模型1774×887原始图片，未放大，按 `STYLE_PREVIEW_ACCEPTED` 接入。41/41表示视点覆盖齐全，不代表已达到原生高清、无缝球面或建筑尺寸验收。每个空间有独立图片、实际像素和材质说明。旧风格图片未用作新风格成品。

首页另有 `floor11-review.html` 静态样图入口，展示 `design-previews/floor11-closed-kitchen-v3.png`（内置生成1774×887）。页面的“在VR中环视”链接指向 `./#floor11_02`；同一修正版按用户要求接入VR，保留实际尺寸、未达4K及接缝/极区待校正说明，未达高清VR验收。文件原字节保存，SHA-256 为 `3a2dc3a1433896d4a32d3d6bc426ca8f9672ee03a97d10cfbeead1ca5d0f4b2a`。页面说明 M2427 的2400×2700为图纸结构洞口，没有公开原PDF或全户型源图。

`floor10_11` 的DRAFT条目和仓库图片副本已移除，本地生成原图保留；当前11层开放厨房版本未导入。`floor11_02` 的目录目标为“餐厅 · 独立厨房门外”。位置仅作示意，生成图几何尚未完成户型核对。2–9层为出租，10层与11层为自用。

已人工审阅、允许展示的风格预览可这样导入完整 PNG：

```sh
node add-approved-panorama.mjs --id standard_02 --image /absolute/path/original.png --preview-accepted --note '首间风格预览，门边接痕仍在修整' --yaw -1.5 --pitch -0.18
```

`--preview-accepted`（兼容旧别名 `--preview`）记录 `approval_status: PREVIEW_ACCEPTED`，仅代表允许展示预览，必须提供可见的限制说明。它不代表无缝全景或完整视觉QA通过。全部视觉验收完成的后续图片可使用 `--approved`；脚本本身不认证视觉质量。这两个高清入口保持至少3840像素宽、2:1、宽度可被4整除的要求。脚本原字节复制图片，计算 SHA-256，更新清单的实际公开数；不生成、放大、拼接或重新编码图片。实际文件像素不证明生成过程为原生4K。

11层修正版使用独立的低分辨率风格预览入口，高清入口门槛保持不变。该条目按用户要求允许环视，接缝与极区仍待校正，不代表已通过球面连续性验收。预览导入必须提供当前房间的材质说明：

```sh
node add-approved-panorama.mjs --id floor11_02 --image /absolute/path/floor11_02_closed_kitchen_v3.png --style-preview --note '内置模型风格预览，实际1774×887，未达4K；接缝及极区待校正，以原户型图和实测为准' --materials '11层自用餐厅与封闭厨房：胡桃木、焦糖皮椅、暖米白石、铝合金与安全玻璃。'
```

`--style-preview` 要求真实2:1 PNG，记录 `quality_tier: STYLE_PREVIEW`；尺寸和格式检查不认证球面连续性。加 `--draft` 时公开列表不变；获准展示的条目去掉 `--draft` 后成为 `STYLE_PREVIEW_ACCEPTED`，该状态只代表允许预览。播放器显示“内置模型风格预览”、实际尺寸以及低于3840像素时的“未达4K”，不把它计作高清验收。11层使用本层材质说明，不套用10层客厅方案。

可选 `--thumbnail /absolute/path/thumb.jpg` 复制已有缩略图；省略则显示文字房间卡片。替换同一视点的不同图片需再次验收并显式加 `--replace`。相同哈希可重复导入。脚本写入范围固定为本目录，不提交或发布。`.import.lock` 防止并发导入；如进程意外结束，应先确认没有导入任务运行再单独移除该锁文件。

首选初始视点为 `standard_02`，URL hash 可以指定其他已接入视点。仅实际接入的节点进入菜单与平面图；未完成的楼层/公寓按钮显示 0/总数并禁用。刷新页面即可获取已发布的最新清单，没有旧进度轮询。首张初始朝向为 yaw=-1.5、pitch=-0.18；户型位置沿用原清单。

播放器读取一张完整等距柱状 PNG。GPU 为兼容纹理上限，高清图仍暂存4条原像素纹理；1774×887使用2条887像素宽纹理，均带相邻像素边缘。这些仅是内存上传，不生成六面图或拼接文件，也不会将原图降采样。成功后 `#view.dataset.sourcePixels` 记录实际尺寸，`textureMode` 记录 `no resampling`。设备纹理上限不足时明确报错，保留原图查看/下载入口。

局部检查：

```sh
node --check viewer.js
node --check add-approved-panorama.mjs
node check.mjs
node check-viewer.mjs
```

`check.mjs` 检查清单、文件哈希、位置、DRAFT隔离及高清导入限制。`check-viewer.mjs` 模拟 DOM/WebGL API，检查原像素复制范围、加载状态、实际尺寸/材质提示和失败分支；它不执行真实GPU着色器，也不证明视觉连续性。两项均不生成图片、不改清单。浏览器实机仍需检查全景画面、拖动、缩放、全屏、加载错误与跨接缝视觉质量。单目全景环视不等于立体头显或自由行走。
