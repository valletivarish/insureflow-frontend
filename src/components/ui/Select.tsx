import clsx from "classnames";
import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";

import styles from "./FormControls.module.css";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, hasError, children, ...props }, ref) => (
    <select ref={ref} className={clsx(styles.control, hasError && styles.errorState, className)} {...props}>
      {children}
    </select>
  )
);

Select.displayName = "Select";
