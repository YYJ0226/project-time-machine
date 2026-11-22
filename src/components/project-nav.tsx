import Link from "next/link";
import type { ReactNode } from "react";

import { Brand } from "./brand";
import styles from "./project-nav.module.css";

export type ProjectSection = "evidence" | "timeline" | "delivery";

const sections: Array<{ id: ProjectSection; label: string; code: string; path: string }> = [
  { id: "evidence", label: "证据工作台", code: "01", path: "" },
  { id: "timeline", label: "时间线与回放", code: "02", path: "/timeline" },
  { id: "delivery", label: "审稿与交付", code: "03", path: "/delivery" },
];

/** Shared header for every page inside one imported project. */
export function ProjectNav({
  projectId,
  projectName,
  active,
  actions,
}: {
  projectId: string;
  projectName: string;
  active: ProjectSection;
  actions?: ReactNode;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.lead}>
          <Brand href="/app" compact label="PTM" />
          <span className={styles.divider} aria-hidden="true" />
          <nav className={styles.crumbs} aria-label="当前位置">
            <Link href="/app">项目</Link>
            <span aria-hidden="true">/</span>
            <strong title={projectName}>{projectName}</strong>
          </nav>
        </div>

        <nav className={styles.tabs} aria-label="项目功能">
          {sections.map((section) => (
            <Link
              key={section.id}
              href={`/app/projects/${projectId}${section.path}`}
              prefetch={false}
              aria-current={active === section.id ? "page" : undefined}
              className={active === section.id ? styles.active : undefined}
            >
              <span aria-hidden="true">{section.code}</span>
              {section.label}
            </Link>
          ))}
        </nav>

        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </header>
  );
}
