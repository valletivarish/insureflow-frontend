import clsx from "classnames";
import type { PropsWithChildren, ReactNode } from "react";

import styles from "./Card.module.css";

interface CardProps {
  className?: string;
}

interface CardHeaderProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function Card({ className, children }: PropsWithChildren<CardProps>) {
  return <div className={clsx(styles.card, className)}>{children}</div>;
}

export function CardHeader({ title, description, actions, children, className }: PropsWithChildren<CardHeaderProps>) {
  return (
    <div className={clsx(styles.header, className)}>
      <div>
        {title && <h3 className={styles.title}>{title}</h3>}
        {description && <p className={styles.description}>{description}</p>}
        {children}
      </div>
      {actions}
    </div>
  );
}

export function CardContent({ className, children }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx(styles.content, className)}>{children}</div>;
}

export function CardFooter({ className, children }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx(styles.footer, className)}>{children}</div>;
}
