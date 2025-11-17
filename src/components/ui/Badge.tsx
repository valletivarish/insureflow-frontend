import clsx from "classnames";
import type { PropsWithChildren } from "react";

import styles from "./Badge.module.css";

export type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ variant = "neutral", className, children }: PropsWithChildren<BadgeProps>) {
  return <span className={clsx(styles.badge, styles[variant], className)}>{children}</span>;
}
