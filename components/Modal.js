"use client";
import { useEffect, useId, useRef } from "react";

/** Accessible modal built on the native <dialog>: focus trap, Esc to close, labelled. */
export default function Modal({ open, onClose, title, children, footer }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open ? (
        <>
          <div className="modal-head">
            <h2 id={titleId} style={{ fontSize: "1.25rem" }}>{title}</h2>
          </div>
          <div className="modal-body">{children}</div>
          {footer ? <div className="modal-foot">{footer}</div> : null}
        </>
      ) : null}
    </dialog>
  );
}
