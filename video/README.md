# Project Time Machine：课程视频工程

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

独立 Remotion 4.0.536 工程，不作为 Next.js 页面部署。当前只提供十五秒开场风格预览，不是完整五至七分钟成片，也尚未导出 MP4。

实验主案例使用 Project Time Machine 自身的真实开发记录；不再为拍片扩展番茄钟。长片叙事遵循动机／需求 → 技术路线 → 实验展示，详见上级 `docs/demo-script.md`。

本人最新指定**背景音乐＋字幕＋动态画面，不要配音讲解**。当前 `CourseOpening` 为无口播版，旧的系统合成语音只是保留的历史素材，不参与播放。

## 本地预览

使用满足本目录 `package.json` engines 的 Node（当前验证环境为 Node 24）；在本目录终端执行：

```powershell
npm ci
npm run dev -- --port=3100
```

打开 [CourseOpening](http://localhost:3100/CourseOpening)，点击播放；画布 1920×1080、30 fps、450 帧，即十五秒。`OpeningScene` 与 `EvidenceCard` 有独立可编辑时间线。

预览已运行时不必重复启动。Studio 是可编辑的本地工具，不是公开网站，不要把它暴露到公网。

## 内容及配音边界

- 画面为原创 HTML/CSS 概念动画，不是平台录屏；三类卡片没有伪造具体 Issue、提交或测试数量。
- 音乐为 `public/audio/music-v1/evidence-pulse.wav`：原创代码合成，128 BPM、32 拍、十五秒；没有现成歌曲采样、语音或网络调用。来源与 SHA-256 保存在同目录 provenance。
- `scripts/generate-music.mjs` 保存确定性音序、和弦、合成音色、淡入淡出及电平处理，拒绝覆盖已有 take。最终六分钟长片需分章编排，不能机械循环这一段。
- 字幕为视觉叙事短句，时间单独维护在 `visual-copy.json`；`Composition.tsx` 保留可编辑内联数组，测试检查文字与时间一致、每句至少三秒。
- 旧 `offline-v2` 语音与 `narration.json` 仅为上一个检查版本的历史素材；不要求生成最终 AI 配音或连接账号。
- 没有外部字体、真人声音或真实教师分享链接。中文字体取当前 Windows 环境；Linux CI 只检查打包，不代表其他机器字体或渲染效果已验收。
- 只用免费或现有额度，任何收费前先询问本人。

## 验证和重新生成

```powershell
npm run lint
npm test
npm run build
```

`lint` 包括 ESLint 与 TypeScript；`test` 执行九项 Node 测试，校验 PCM、截断、信号、历史音轨完整性、当前字幕、原创音乐和当前画面只引用音乐而不引用旧语音。`build` 只打包 Studio/渲染资源，不导出 MP4。

音乐已随工程提供，运行预览或 CI 不需要 Windows 语音服务。下方是**已停用语音草案的历史复现**，当前无需执行（仅 Windows）：

```powershell
powershell.exe -NoProfile -File scripts/generate-local-voice.ps1 -Voice "Microsoft Huihui Desktop" -Take offline-new
```

合成脚本拒绝覆盖已有 take，失败的半成品保留；`offline-v1` 是首次不可用音色尝试留下的空目录，不参与版本管理或交付。`prepare-audio.mjs` 针对固定 `offline-v2` 将三段 WAV 拼接成已提交的音轨，拒绝覆盖；不要为重跑删除已有资料。更换音轨时应另建 take、重新测量字幕与核对来源，不直接复用旧时间戳。

## 上游来源与保留事项

工程由官方 `create-video@4.0.536 --yes --blank --no-tailwind video` 脚手架建立。`src/basic-captions.tsx` 按官方 [Basic Captions 源码](https://www.remotion.dev/elements/captions/basic-captions.md)原样引入，保留其内容。Remotion 及第三方包各有许可，当前不授予额外再分发权。

渲染输出、构建及依赖不入 Git；不更改平台数据库、登录状态或 AI 审阅记录。先验收十五秒样片，再决定完整录制与导出。

Remotion 文档：[基础说明](https://www.remotion.dev/docs/the-fundamentals)；[上游许可](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)。
