import clsx from "classnames";
import { useEffect } from "react";
import type { ReactNode } from "react";

import styles from "./Modal.module.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, footer, children, className }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={clsx(styles.modal, className)}>
        <header className={styles.header}>
          <div>
            {title && <h3 className={styles.title}>{title}</h3>}
          </div>
          <button className={styles.close} onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>
  );
}
