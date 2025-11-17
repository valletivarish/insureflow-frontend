import clsx from "classnames";
import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

import styles from "./FormControls.module.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, hasError, ...props }, ref) => (
  <input ref={ref} className={clsx(styles.control, hasError && styles.errorState, className)} {...props} />
));

Input.displayName = "Input";
