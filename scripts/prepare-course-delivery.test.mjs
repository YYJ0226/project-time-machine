import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import {
  COURSE_FILES,
  prepareCourseDelivery,
} from "./prepare-course-delivery.mjs";

const fixtures = [];
const git = (root, args) =>
  execFileSync(
    "git",
    [
      "-c",
      "core.hooksPath=.git/no-test-hooks",
      "-c",
      "commit.gpgsign=false",
      ...args,
    ],
    {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
function fixture(overrides = {}) {
  const root = mkdtempSync(join(tmpdir(), "ptm-course-test-"));
  fixtures.push(root);
  git(root, ["init", "-q"]);
  git(root, ["config", "user.name", "Course kit test"]);
  git(root, ["config", "user.email", "test@example.invalid"]);
  writeFileSync(join(root, ".gitignore"), "/artifacts/\n.env*\n");
  for (const path of COURSE_FILES) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(
      join(root, path),
      overrides[path] ?? `Committed fixture: ${path}\n`,
    );
  }
  git(root, ["add", "."]);
  git(root, ["commit", "-qm", "fixture baseline"]);
  return root;
}
afterEach(() => {
  for (const root of fixtures.splice(0)) {
    const target = resolve(root);
    // Delete only test-owned, exact temporary directories, never a repository or home.
    if (!target.startsWith(resolve(tmpdir()) + sep + "ptm-course-test-"))
      throw new Error("Unsafe test cleanup target");
    rmSync(target, { recursive: true, force: true });
  }
});

describe("course recording preparation package", { timeout: 20000 }, () => {
  it("writes an allowlisted package with verifiable hashes and honest status", () => {
    const root = fixture();
    const { output, manifest } = prepareCourseDelivery(
      root,
      new Date("2026-10-17T03:00:00Z"),
    );
    expect(manifest.sourceHead).toBe(git(root, ["rev-parse", "HEAD"]).trim());
    expect(manifest.generatedAt).toBe("2026-10-17T03:00:00.000Z");
    expect(manifest.kind).toBe("recording-preparation-only");
    expect(manifest.ciStatus).toBe("not_checked");
    expect(manifest.deploymentStatus).toBe("not_checked");
    expect(manifest.files.map((entry) => entry.path)).toEqual([
      ...COURSE_FILES,
      "commit-history.json",
      "START-HERE.md",
    ]);
    for (const entry of manifest.files) {
      const content = readFileSync(join(output, entry.path));
      expect(content.length).toBe(entry.bytes);
      expect(createHash("sha256").update(content).digest("hex")).toBe(
        entry.sha256,
      );
    }
    expect(
      JSON.parse(readFileSync(join(output, "manifest.json"), "utf8")),
    ).toEqual(manifest);
    expect(readFileSync(join(output, "START-HERE.md"), "utf8")).toContain(
      "不是已录好的视频",
    );
    expect(git(root, ["status", "--porcelain"]).trim()).toBe("");
  });

  it("never copies ignored environment files or unrelated tracked files", () => {
    const root = fixture();
    writeFileSync(join(root, ".env.local"), "PRIVATE_SENTINEL=local-only\n");
    writeFileSync(join(root, "unrelated.md"), "not for submission");
    git(root, ["add", "unrelated.md"]);
    git(root, ["commit", "-qm", "unrelated fixture"]);
    const { output } = prepareCourseDelivery(root);
    expect(existsSync(join(output, ".env.local"))).toBe(false);
    expect(existsSync(join(output, "unrelated.md"))).toBe(false);
    expect(existsSync(join(output, ".git"))).toBe(false);
  });

  it.each(["tracked", "untracked"])(
    "rejects %s changes before writing output",
    (kind) => {
      const root = fixture();
      writeFileSync(
        join(root, kind === "tracked" ? "README.md" : "new.md"),
        "pending change",
      );
      expect(() => prepareCourseDelivery(root)).toThrow("工作区尚未提交");
      expect(existsSync(join(root, "artifacts"))).toBe(false);
    },
  );

  it.each([
    "/review/" + "a".repeat(43),
    "sk-" + "a".repeat(32),
    "-----BEGIN PRIVATE KEY-----",
  ])(
    "rejects sensitive patterns without including the value in its error",
    (sensitive) => {
      const root = fixture({ "README.md": sensitive });
      let message = "";
      try {
        prepareCourseDelivery(root);
      } catch (error) {
        message = error.message;
      }
      expect(message).toContain("资料可能含密钥或能力链接");
      expect(message).not.toContain(sensitive);
      expect(existsSync(join(root, "artifacts"))).toBe(false);
    },
  );

  it("does not follow an artifacts directory junction or symbolic link", () => {
    const root = fixture();
    const external = join(root, "outside");
    mkdirSync(external);
    symlinkSync(
      external,
      join(root, "artifacts"),
      process.platform === "win32" ? "junction" : "dir",
    );
    // POSIX Git does not match a symlink with the directory-only /artifacts/ rule.
    // Ignore the link in this fixture only, so the later directory guard is reached.
    writeFileSync(join(root, ".git", "info", "exclude"), "/artifacts\n");
    expect(git(root, ["status", "--porcelain"]).trim()).toBe("");
    expect(() => prepareCourseDelivery(root)).toThrow("不会跟随目录链接");
    expect(readdirSync(external)).toEqual([]);
  });

  it("does not overwrite an existing package on the next run", () => {
    const root = fixture();
    const first = prepareCourseDelivery(root);
    const original = readFileSync(join(first.output, "manifest.json"), "utf8");
    const second = prepareCourseDelivery(root);
    expect(second.output).not.toBe(first.output);
    expect(readFileSync(join(first.output, "manifest.json"), "utf8")).toBe(
      original,
    );
  }, 15000);

  it("rejects a nested source directory", () => {
    const root = fixture();
    expect(() => prepareCourseDelivery(join(root, "docs"))).toThrow(
      "仓库根目录",
    );
  });

  it("rejects a non-directory artifacts path", () => {
    const root = fixture();
    writeFileSync(join(root, "artifacts"), "existing user file");
    git(root, ["add", "-f", "artifacts"]);
    git(root, ["commit", "-qm", "tracked file at output path"]);
    expect(() => prepareCourseDelivery(root)).toThrow("输出目录不是普通目录");
    expect(readFileSync(join(root, "artifacts"), "utf8")).toBe(
      "existing user file",
    );
  });

  it("rejects a missing committed source before creating output", () => {
    const root = fixture();
    git(root, ["rm", "docs/product-brief.md"]);
    git(root, ["commit", "-qm", "missing required source"]);
    expect(() => prepareCourseDelivery(root)).toThrow("缺少已提交的普通文件");
    expect(existsSync(join(root, "artifacts"))).toBe(false);
  });
});
