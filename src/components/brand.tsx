import Link from "next/link";

import styles from "./brand.module.css";

/** The orbit mark: an observatory ring, a partial trace and one amber signal. */
export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <span className={styles.mark} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14.6" className={styles.ring} />
        <path d="M16 7.2a8.8 8.8 0 1 1-8.8 8.8" className={styles.trace} />
        <circle cx="16" cy="16" r="2.1" className={styles.core} />
        <circle cx="25.6" cy="6.6" r="2.3" className={styles.signal} />
      </svg>
    </span>
  );
}

export function Brand({
  href = "/",
  subtitle,
  compact = false,
  label = "Project Time Machine",
}: {
  href?: string;
  subtitle?: string;
  compact?: boolean;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className={`${styles.brand} ${compact ? styles.compact : ""}`}
      aria-label={`${label} 首页`}
    >
      <BrandMark size={compact ? 30 : 34} />
      <span className={styles.text}>
        <strong>{label}</strong>
        {subtitle ? <small>{subtitle}</small> : null}
      </span>
    </Link>
  );
}
