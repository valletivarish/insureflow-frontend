import clsx from "classnames";
import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

import styles from "./FormControls.module.css";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError, rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={clsx(styles.control, hasError && styles.errorState, className)}
      {...props}
    />
  )
);

Textarea.displayName = "Textarea";
