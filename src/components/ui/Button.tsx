import clsx from "classnames";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

import styles from "./Button.module.css";

type ButtonVariant = "solid" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "solid", size = "md", isLoading = false, children, className, disabled, ...props },
    ref
  ) => {
    const isNeutralVariant = variant !== "solid";
    return (
      <button
        ref={ref}
        className={clsx(styles.button, styles[`variant-${variant}`], styles[`size-${size}`], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span className={clsx(styles.spinner, isNeutralVariant && styles.spinnerDark)} aria-hidden="true" />
        )}
        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";
