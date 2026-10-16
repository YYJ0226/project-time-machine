# 项目证据模型与同步边界

阶段三把 GitHub 上分散的开发记录归一为可核验的证据，而不是直接生成一段无法追溯的总结。

## 三层数据

| 层级 | 数据表 | 用途 |
| --- | --- | --- |
| 同步批次 | `sync_runs` | 记录每次采集何时发生、是否成功以及各类数量 |
| 原始证据 | `evidence_items` | 保存 Issue、Commit、Pull Request、CI Check 的统一字段和必要源数据 |
| 证据关系 | `evidence_links` | 保存系统建议以及学生确认或拒绝的结果 |

每条证据都保留 GitHub 原文链接。公开展示与后续 AI 总结应优先引用这些来源事实。

## 当前采集范围

一次手动同步最多读取最近 100 条：

- Issue（排除 GitHub Issues API 中混入的 Pull Request）；
- Commit；
- Pull Request；
- GitHub Actions workflow run，作为当前阶段的测试状态。

阶段三继续只处理当前登录用户拥有的公开仓库，不保存 GitHub provider token，也不修改源仓库。服务端可配置一个只读 `GITHUB_TOKEN` 提升公共 API 请求额度；它不会进入浏览器包或数据库。未配置时会降级为未认证请求，请求额度不足则把同步记录标记失败并显示可恢复错误。

## 关联规则

系统只在存在明确线索时提出建议：

- Commit message 引用 `#Issue编号`；
- PR 标题、描述或分支名引用 `#Issue编号`；
- Commit SHA 等于 PR 的 head SHA 或 merge commit SHA；
- CI workflow run 的 head SHA 等于 PR 的 head SHA 或 merge commit SHA。

建议带有规则评分和可读原因。规则评分是固定规则的排序权重，不是统计正确率或 AI 概率。
学生必须手动“确认关联”后，它才成为已确认的证据链；选择“忽略”会保留审阅记录。
后续同步只插入尚不存在的关系，不更新已有关系，因此不会覆盖人工决定。

工作台分为待确认、已确认和已忽略三个区域。已审阅关系可以“撤销审阅”，回到待确认状态；
撤销时清空审阅时间，不删除关系。保存失败或未找到当前用户拥有的关系时，页面会显示错误。

当前关系方向为：Issue → Commit/PR（实现于）、Commit → PR（归入）、PR → CI（验证于）。
数据库沿用 `implements`、`contains`、`verifies` 三个标识；其中 `contains` 表示源提交归入目标 PR。

每条证据可以展开查看正文；每条关系的两端都链接到 GitHub 原文。各信号轨道默认显示 12 条，
其余已采集证据可继续展开，不会因界面截断而无法访问。

## 安全边界

- 同步前重新核验 GitHub 仓库仍为当前账号拥有的公开仓库；
- Server Action 再次按 `owner_id` 查询项目；
- 三张数据表均启用 RLS；
- `evidence_links` 的来源和目标必须属于同一用户、同一项目；
- GitHub 响应只保留建立证据链所需的最小字段。
