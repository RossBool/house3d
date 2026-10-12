# 意式现代全景入口

独立静态目录，部署后路径为 `/house3d/italian/`。既有 `/house3d/panorama/` 保留。

当前为首间意式风格预览，进度 1/41：`standard_02`（A 起居），3840×1920 PNG。门边闭合接痕仍待修整。没有复制旧风格图片。`catalog.json` 含 41 个原户型位置元数据（standard 21 / floor10 13 / floor11 7），这些条目不是已生成图片。

首页另有 `floor11-review.html` 独立静态样图入口，展示 `design-previews/floor11-closed-kitchen-v3.png`（内置生成1774×887）。这是11层餐厅与封闭厨房户型修正样图，未达高清VR验收，不接入360°球面播放器、不计入VR的1/41。文件原字节保存，SHA-256 为 `3a2dc3a1433896d4a32d3d6bc426ca8f9672ee03a97d10cfbeead1ca5d0f4b2a`。页面说明 M2427 的2400×2700为图纸结构洞口，没有公开原PDF或全户型源图。

`floor10_11` 的DRAFT条目和仓库图片副本已移除，本地生成原图保留；当前11层开放厨房版本未导入。`floor11_02` 的目录目标为“餐厅 · 独立厨房门外”。位置仅作示意，生成图几何尚未完成户型核对。2–9层为出租，10层与11层为自用。

已人工审阅、允许展示的风格预览可这样导入完整 PNG：

```sh
node add-approved-panorama.mjs --id standard_02 --image /absolute/path/original.png --preview-accepted --note '首间风格预览，门边接痕仍在修整' --yaw -1.5 --pitch -0.18
```

`--preview-accepted`（兼容旧别名 `--preview`）记录 `approval_status: PREVIEW_ACCEPTED`，仅代表允许展示预览，必须提供可见的限制说明。它不代表无缝全景或完整视觉QA通过。全部视觉验收完成的后续图片可使用 `--approved`；脚本本身不认证视觉质量。这两个高清入口保持至少3840像素宽、2:1、宽度可被4整除的要求。脚本原字节复制图片，计算 SHA-256，更新清单的实际公开数；不生成、放大、拼接或重新编码图片。实际文件像素不证明生成过程为原生4K。

以下低分辨率球面预览能力保留，但当前没有启用条目。只有视觉核对确认适合球面播放的图片才可使用；普通风格样图使用独立静态页面。预览导入必须提供当前房间的材质说明：

```sh
node add-approved-panorama.mjs --id floor10_11 --image /absolute/path/floor10_11.png --style-preview --draft --note '内置模型风格预览，实际1774×887，未达4K；户型与全景接缝待核对' --materials '10层自用客厅：燕麦色布艺沙发、驼色皮革、胡桃木与暖色石材。'
```

`--style-preview` 要求真实完整2:1 PNG，记录 `quality_tier: STYLE_PREVIEW`。加 `--draft` 时公开列表不变；视觉QA确认允许展示后，重新运行同一条命令并去掉 `--draft`，才会成为 `STYLE_PREVIEW_ACCEPTED`。播放器显示“内置模型风格预览”、实际尺寸以及低于3840像素时的“未达4K”，不把它计作高清验收。11层后续修正版的材质应填写焦糖皮椅、胡桃木与暖白石；不要套用10层客厅说明。

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
