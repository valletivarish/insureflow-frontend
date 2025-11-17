import clsx from "classnames";
import type { PropsWithChildren } from "react";

import styles from "./FormControls.module.css";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export function FormField({ label, htmlFor, hint, error, required, className, children }: PropsWithChildren<FormFieldProps>) {
  return (
    <label className={clsx(styles.field, className)} htmlFor={htmlFor}>
      <span className={styles.label}>
        {label}
        {required && " *"}
      </span>
      {children}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
      {error && <span className={styles.message}>{error}</span>}
    </label>
  );
}
