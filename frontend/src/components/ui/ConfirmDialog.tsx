"use client";
import { AlertTriangle } from "lucide-react";
import css from "./confirmDialog.module.css";

interface IProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = ({
  title,
  message,
  confirmLabel = "Удалить",
  cancelLabel = "Отмена",
  danger = true,
  onConfirm,
  onCancel,
}: IProps) => {
  return (
    <div className={css.scrim} onClick={onCancel}>
      <div className={css.dialog} onClick={(event) => event.stopPropagation()}>
        <span className={css.icon} data-danger={danger}>
          <AlertTriangle size={18} />
        </span>

        <h3 className={css.title}>{title}</h3>
        <p className={css.message}>{message}</p>

        <div className={css.actions}>
          <button type="button" className={css.cancelBtn} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={css.confirmBtn}
            data-danger={danger}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
