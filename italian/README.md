# 意式现代全景入口

独立静态目录，部署后路径为 `/house3d/italian/`。既有 `/house3d/panorama/` 保留。

当前为首间意式风格预览，进度 1/41：`standard_02`（A 起居），3840×1920 PNG。门边闭合接痕仍待修整。没有复制旧风格图片。`catalog.json` 含 41 个原户型位置元数据（standard 21 / floor10 13 / floor11 7），这些条目不是已生成图片。

已人工审阅、允许展示的风格预览可这样导入完整 PNG：

```sh
node add-approved-panorama.mjs --id standard_02 --image /absolute/path/original.png --preview --note '首间风格预览，门边接痕仍在修整' --yaw -1.5 --pitch -0.18
```

`--preview` 记录 `approval_status: PREVIEW_ACCEPTED`，仅代表允许展示预览，必须提供可见的限制说明。它不代表无缝全景或完整视觉QA通过。全部视觉验收完成的后续图片可使用 `--approved`；脚本本身不认证视觉质量。PNG文件须至少3840像素宽、2:1，宽度可被4整除。脚本原字节复制图片，计算 SHA-256，更新 `manifest.json` 和 `tour.js` 的实际接入数。不会生成、放大或重新编码图片；实际文件像素不证明生成过程为原生4K。

可选 `--thumbnail /absolute/path/thumb.jpg` 复制已有缩略图；省略则显示文字房间卡片。替换同一视点的不同图片需再次验收并显式加 `--replace`。相同哈希可重复导入。脚本写入范围固定为本目录，不提交或发布。`.import.lock` 防止并发导入；如进程意外结束，应先确认没有导入任务运行再单独移除该锁文件。

首选初始视点为 `standard_02`，URL hash 可以指定其他已接入视点。仅实际接入的节点进入菜单与平面图；未完成的楼层/公寓按钮显示 0/总数并禁用。刷新页面即可获取已发布的最新清单，没有旧进度轮询。首张初始朝向为 yaw=-1.5、pitch=-0.18；户型位置沿用原清单。

播放器读取一张完整等距柱状 PNG。GPU 为兼容纹理上限，暂存4条原像素纹理并带相邻像素边缘；不会生成六面图片，也不会将原图降采样。成功后 `#view.dataset.sourcePixels` 记录实际尺寸，`textureMode` 记录 `no resampling`。设备纹理上限不足时明确报错，保留原图查看/下载入口。

局部检查：

```sh
node --check viewer.js
node --check add-approved-panorama.mjs
node check.mjs
```

`check.mjs` 检查清单、文件哈希、位置及导入限制，不生成图片、不改清单。浏览器实机仍需检查全景画面、拖动、缩放、全屏、加载错误与跨接缝视觉质量。单目全景环视不等于立体头显或自由行走。
