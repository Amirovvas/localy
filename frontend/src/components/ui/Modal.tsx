"use client";
import { X } from "lucide-react";
import css from "./modal.module.css";

interface IProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}

const Modal = ({ title, subtitle, onClose, children, footer, width = 480 }: IProps) => {
  return (
    <div className={css.scrim} onClick={onClose}>
      <div
        className={css.modal}
        style={{ maxWidth: width }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={css.header}>
          <div>
            <h3 className={css.title}>{title}</h3>
            {subtitle && <p className={css.subtitle}>{subtitle}</p>}
          </div>
          <button type="button" className={css.closeBtn} onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>

        <div className={css.body}>{children}</div>

        {footer && <div className={css.footer}>{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
