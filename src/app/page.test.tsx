import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "./page";

describe("public homepage entry points", () => {
  it("offers an explicit login link after signing out", () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toMatch(/<a\b[^>]*href="\/login"[^>]*>登录<\/a>/);
  });

  it("links to the protected workspace without claiming the visitor is signed in", () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toMatch(/<a\b[^>]*href="\/app"[^>]*>进入工作台<\/a>/);
    expect(html).toContain("未登录时将先连接 GitHub");
  });

  it("keeps the public sample distinct from real project data", () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('href="#observatory"');
    expect(html).toContain("样例数据");
    expect(html).toContain("样例不代表你的项目数据");
    expect(html).not.toContain("业务数据接入将在后续阶段完成");
  });
});
