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

建议带有置信度和可读原因。学生必须手动“确认关联”后，它才成为已确认的证据链；选择“忽略”会保留审阅记录，后续同步不会覆盖人工决定。

## 安全边界

- 同步前重新核验 GitHub 仓库仍为当前账号拥有的公开仓库；
- Server Action 再次按 `owner_id` 查询项目；
- 三张数据表均启用 RLS；
- `evidence_links` 的来源和目标必须属于同一用户、同一项目；
- GitHub 响应只保留建立证据链所需的最小字段。
