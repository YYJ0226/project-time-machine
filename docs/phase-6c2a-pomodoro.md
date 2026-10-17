# 阶段 6C2a：真实番茄钟实验与视频准备

日期：2026-10-17。状态：P1 代码、无界面回归及 Git 留痕完成；待本人桌面验收。无音频／MP4 成品，不将本检查点称为成片验收。

后续本人已明确“番茄钟验收通过”，桌面验收待办据此完成；随后改选平台自身作为视频主案例，不继续番茄钟 P2/P3。下文保留 C2a 当时的交付快照，不视为最新制作计划；最新状态见 [C2b-1](phase-6c2b-sample.md)。

## 本次产出

实验仓库位于 `D:\vscode\pomodoro-timer`，来自本人授权的 [YYJ0226/pomodoro-timer](https://github.com/YYJ0226/pomodoro-timer)，保留 Windows Tkinter 定位。原主分支未改写。

- [Issue #1](https://github.com/YYJ0226/pomodoro-timer/issues/1)：明确错误输入、范围与设置部分生效的问题。
- `ad39b86`：先建立失败回归；9 个测试方法含子测试，汇总 16 个断言失败、4 个错误。零值产生真实除零异常，第二项无效产生真实工作时长变化。
- `1ee0f60`：两项先校验、再一起应用；工作 1–60、休息 1–30 分钟，错误保留原设置和计时状态。
- `9ece0573603d4700780b664dfd9f8f1824f0a2e3`：增加 Windows 双 Python 版本 CI、README、复现及桌面验收文档。
- [PR #2](https://github.com/YYJ0226/pomodoro-timer/pull/2)：已创建并关联本聊天，未合并。

三个提交对应真实的测试、实现和持续集成／文档工作；不倒签日期、不刷空提交，也不为了视频故意让公开主分支失败。

## 验证与限制

- 本地 Windows / Python 3.11：9 个方法全部通过，覆盖 28 组输入／模式组合；`py_compile` 及 `git diff --check` 通过。
- 云端推送检查 [39008928937](https://github.com/YYJ0226/pomodoro-timer/actions/runs/39008928937)：源提交 `9ece057`，Windows Python 3.11、3.13 两项均成功；实际日志均有 `Ran 9 tests` 和 `OK`。
- PR 检查以其实时状态为准；不是平台本身 CI，也不代表 PTM 线上已导入此案例。
- 测试调用真实设置、重置和进度更新方法，只替换 Tk 控件与消息框，不创建窗口；尚不能声称界面、通知、计时线程或计时精度验收通过。
- 当前不能自动采集原生 Tk 窗口。请按番茄钟仓库 `docs/p1-settings-validation.md` 在本机检查零值、第二项错误、合法设置和两种模式；真实截图／录屏才可作为视频界面证据。
- P2 计时调度、P3 持久化均未开始，避免一次完成多批。

## 视频技能和配音状态

使用 skill-installer 的官方帮助脚本安装 [Remotion 官方技能](https://github.com/remotion-dev/skills)，仅安装 `skills/remotion-best-practices`，锁定 `1441a11e95db35443bd76bb318386c0d3ca00053`。本地位置为 `C:\Users\Lenovo\.codex\skills\remotion-best-practices`，下一轮可用。已完整读取其入口和创建工程参考，尚未执行工程初始化或渲染。

技能安装不等于渲染依赖安装：未新建视频工程，未安装渲染依赖、下载 ASR 大模型、调用付费配音或生成十至十五秒有声样片。现有 Node/Python 可用；`ffmpeg`/`ffprobe` 未在当前 PATH 发现，这不是对整台机器的全盘结论。

通过插件目录检查到 Runway、Higgsfield 具有配音能力；Runway 是可选连接候选，当前未连接，不假定中文音色、可用额度或免费。仍需确定可用配音来源；默认免费或现有额度，任何付费先报价格取得同意，不索取明文密钥。

## 下一检查点

本轮先暂停，等待 P1 桌面验收和配音来源确认。之后创建独立视频工程，先做十至十五秒有声样片，验收风格、中文读音、字幕与真实素材标注；通过后才扩展五至七分钟整片。

PTM 本轮仅更新文档，不部署、不创建教师分享、不发起 AI 归纳、不合并既有 PR。原 `.tmp_pdf_pages` 目录保留，不删除、提交或擅自忽略。手机验收仍延期。
