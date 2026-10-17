# 《开发的来路》· 五分钟整片

本目录是独立 Canvas 影片工程，不是 Next.js 功能，也不部署到 Vercel。当前交付五分钟整片（动机 → 技术路线 → 实验 → 边界），并保留已验收的三十秒开场作为第一段。唯一案例是 Project Time Machine，无配音。

整片分镜见 [五分钟分镜](../docs/vibe-full-film-storyboard.md)，开场分镜见 [三十秒分镜](../docs/vibe-opening-storyboard.md)，验收见 [整片记录](../docs/vibe-full-film-acceptance.md)，事实见 [事实表](../docs/vibe-film-facts-and-hooks.md)。本地首页截图为真实页面，首页自身含样例数据；册页、装订、引用突出为明确标注的“证据组织示意”，不是产品实际点击或新审批。

## 运行

Python 3.11+、Chrome、ffmpeg、ffprobe。先在项目外或忽略目录建虚拟环境，安装 `requirements.txt`，再运行 `python engine/get_fonts.py`，从 Google Fonts 官方仓库取得字体及 OFL 许可。字体约 45 MB，不提交 Git。Playwright 使用本机 Chrome，不另下载浏览器。

```powershell
$env:VIBE_CHROME='C:\Users\Lenovo\AppData\Local\Google\Chrome\Application\chrome.exe'
python video-vibe/verify.py
python video-vibe/engine/render.py video-vibe --det
$env:VIBE_REVIEW='review-r2'
python video-vibe/engine/render.py video-vibe --stills 2.5 8 13 17 21 29
python video-vibe/engine/render.py video-vibe --motion 4.5 6.5
python video-vibe/engine/render.py video-vibe --clip 0 150 fullA
python video-vibe/engine/render.py video-vibe --clip 150 300 fullB
```

ffmpeg 必须位于进程 PATH；本机现有运行时可用 `video/node_modules/@remotion/compositor-win32-x64-msvc/`。输出拒绝覆盖，重渲请更换文件名；`VIBE_REVIEW` 保留各轮同刻检查图。仅监听 127.0.0.1；路径解析限制在工程／引擎内，不提供 `.env`、Python 源码或目录列表。禁用上游并行清理路径。生成物均忽略。

## 指定音乐（本地，不入仓库）

用户指定 [We Never (Remix)](https://music.163.com/song?id=3443610299)，页面署名“我无记忆”；“若如初见”为用户版本备注。`scripts/fetch-course-music.mjs` 只访问供应方公开音频地址，不使用 Cookie、登录或付费服务，拒绝覆盖并记录 SHA-256。公开可取得音频不代表已取得公开传播授权，本阶段只交本地样片。

```powershell
node scripts/fetch-course-music.mjs
python video-vibe/prepare_audio.py artifacts/course-music/we-never-remix-3443610299.mp3 artifacts/course-music/sample-30s-v1.wav --ffmpeg <ffmpeg路径>
ffmpeg -n -i video-vibe/renders/opening-v3-silent.mp4 -i artifacts/course-music/sample-30s-v1.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -t 30 -movflags +faststart video-vibe/renders/opening-v3.mp4
```

原音轨 189.84 秒、48 kHz 双声道。本样片取 0–30 秒，-8 dB，0.5 秒淡入、1.25 秒淡出。`prepare_audio.py` 保存峰值和节奏候选；候选只是算法估计，不当作精确 BPM 或试听结论。不提交音轨、混音、成片或字体；不自动循环整曲。

## 引擎来源与修改

引擎来自 [HeyChengC/vibe-knowledge-film](https://github.com/HeyChengC/vibe-knowledge-film)，固定版本 `62d51508aad00003dc6209afa80c4b5dc540de59`。保留 [MIT 许可及参考内容排除条款](engine/LICENSE)，未复制参考影片的文案或画面。影片代码、册页内容及分镜为本项目独立编写。

本地修改：本机 Chrome 路径参数、软件 Canvas 渲染、原生 Canvas PNG 导出（不经浏览器页面截图合成）、严格随机跳帧检查、路径越界防护、编码失败退出、输出不覆盖和分轮 QA。旧 `video/` 的十五秒 Remotion 卡片原型保留为对照，不冒充新版。

快速源码检查为 `node --test video-vibe/source.check.mjs` 与 `python -m unittest discover -s video-vibe -p test_server.py`，云端 CI 不下载音频、字体或渲染整片，也不把这些检查冒充视觉验收。
