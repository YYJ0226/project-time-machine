import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const COURSE_FILES = Object.freeze([
  "README.md",
  "package.json",
  "docs/product-brief.md",
  "docs/demo-script.md",
  "docs/recording-checklist.md",
  "docs/course-delivery.md",
  "docs/video-production-plan.md",
]);

// Defense in depth only: a short pattern list cannot prove that text is secret-free.
const SENSITIVE_TEXT = [
  /\/review\/[A-Za-z0-9_-]{43}(?![A-Za-z0-9_-])/,
  /\b(?:sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|sb_secret_[A-Za-z0-9_-]{16,})\b/,
  /-----BEGIN (?:[A-Z ]+)?PRIVATE KEY-----/,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
];

function git(root, args, encoding = "utf8") {
  return execFileSync("git", args, {
    cwd: root,
    encoding,
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function assertExistingDirectory(path) {
  const stat = lstatSync(path, { throwIfNoEntry: false });
  if (!stat) return;
  if (
    stat.isSymbolicLink() ||
    !stat.isDirectory() ||
    realpathSync(path) !== path
  )
    throw new Error("输出目录不是普通目录，已停止；不会跟随目录链接。");
}

function ensureDirectory(path) {
  try {
    mkdirSync(path);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  assertExistingDirectory(path);
}

export function prepareCourseDelivery(directory, now = new Date()) {
  const root = realpathSync(resolve(directory));
  if (realpathSync(git(root, ["rev-parse", "--show-toplevel"]).trim()) !== root)
    throw new Error("请在项目仓库根目录准备资料。");
  const artifacts = join(root, "artifacts");
  const parent = join(artifacts, "course-delivery");
  // Inspect each existing parent before Git resolves a path beneath it. POSIX Git
  // rejects pathspecs beyond symlinks before check-ignore can inspect the rule.
  assertExistingDirectory(artifacts);
  assertExistingDirectory(parent);
  if (git(root, ["status", "--porcelain", "--untracked-files=all"]).trim())
    throw new Error(
      "工作区尚未提交，请先检查并提交本阶段改动；不会自动提交或忽略文件。",
    );
  if (
    git(root, [
      "check-ignore",
      "--no-index",
      "artifacts/course-delivery/probe",
    ]).trim() !== "artifacts/course-delivery/probe"
  )
    throw new Error("资料输出目录必须被 Git 忽略。");

  const head = git(root, ["rev-parse", "HEAD"]).trim();
  let branch = null;
  try {
    branch = git(root, ["symbolic-ref", "--short", "HEAD"]).trim();
  } catch {}
  const files = new Map();
  for (const path of COURSE_FILES) {
    const tree = git(root, ["ls-tree", head, "--", path]);
    if (!/^100(?:644|755) blob /.test(tree))
      throw new Error(`缺少已提交的普通文件：${path}`);
    const content = git(root, ["show", `${head}:${path}`], null);
    if (
      SENSITIVE_TEXT.some((pattern) => pattern.test(content.toString("utf8")))
    )
      throw new Error(
        `资料可能含密钥或能力链接，已停止：${path}（不输出匹配内容）`,
      );
    files.set(path, content);
  }
  const commits = git(root, ["log", "-30", "--format=%H%x09%cI"])
    .trim()
    .split("\n")
    .map((line) => {
      const [sha, committedAt] = line.trim().split("\t");
      return { sha, committedAt };
    });
  files.set(
    "commit-history.json",
    Buffer.from(
      JSON.stringify(
        {
          limit: 30,
          count: commits.length,
          shallowRepository:
            git(root, ["rev-parse", "--is-shallow-repository"]).trim() ===
            "true",
          notice:
            "仅为当前 HEAD 可达的最近提交；时间不代表劳动时长，未包含作者邮箱。",
          commits,
        },
        null,
        2,
      ) + "\n",
    ),
  );
  files.set(
    "START-HERE.md",
    Buffer.from(
      "# 课程录屏准备包\n\n" +
        "这是录制准备材料，不是已录好的视频、完整源码归档或平台数据库证据导出。\n\n" +
        "只含七份白名单原文；README 的其余文档链接请到源码仓库查看。\n\n" +
        "1. 先读 docs/course-delivery.md 和 docs/recording-checklist.md。\n" +
        "2. 按 docs/demo-script.md 排练；目标五至七分钟、AI 配音，具体时长按音频实测。\n" +
        "3. 从平台手动下载最新报告和提纲，人工核对版本后再另行整理。\n" +
        "4. 采集真实操作并与 AI 配音合成，回看后填写验收表；本包没有虚构 MP4、音频或字幕。\n\n" +
        `材料对应 Git 提交：${head}。线上部署与 CI 状态未由此命令核验。\n\n` +
        "公开前人工检查账号、分享链接与个人信息。自动模式扫描不能保证没有秘密。\n",
    ),
  );
  const manifest = {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    timezone: "Asia/Shanghai",
    kind: "recording-preparation-only",
    sourceHead: head,
    sourceBranch: branch,
    cleanWorkingTree: true,
    deploymentStatus: "not_checked",
    ciStatus: "not_checked",
    files: [...files].map(([path, content]) => ({
      path,
      bytes: content.length,
      sha256: createHash("sha256").update(content).digest("hex"),
    })),
    notice:
      "哈希只校验包内文件完整性，不是签名或安全证明；不包含 manifest 自身。",
  };

  // Validate all source files before creating any output. Each run is a fresh directory.
  ensureDirectory(artifacts);
  ensureDirectory(parent);
  const output = mkdtempSync(join(parent, "kit-"));
  for (const [path, content] of files) {
    const destination = join(output, path);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, content, { flag: "wx" });
  }
  // Written last: a directory without a manifest is incomplete and must not be submitted.
  writeFileSync(
    join(output, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    { flag: "wx" },
  );
  return { output, manifest };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
    const { output, manifest } = prepareCourseDelivery(root);
    console.log(`准备材料已生成：${output}`);
    console.log(`来源提交：${manifest.sourceHead}`);
    console.log("只读本地资料准备完成；尚未录制视频，未核验线上部署或 CI。");
  } catch (error) {
    // Never print child-process stderr: it can contain paths or configuration details.
    console.error(
      error instanceof Error && !("stderr" in error)
        ? error.message
        : "准备材料失败，请检查 Git、已提交白名单文件与目录权限。",
    );
    process.exitCode = 1;
  }
}
