"use client";
import { useId } from "react";

function Field({ label, error, hint, children, id, className = "" }) {
  return (
    <div className={`field ${className}`}>
      <label className="label" htmlFor={id}>{label}</label>
      {children}
      {hint && !error ? <span className="hint" id={`${id}-hint`}>{hint}</span> : null}
      {error ? <span className="error-text" id={`${id}-err`} role="alert">{error}</span> : null}
    </div>
  );
}

const describe = (id, error, hint) => (error ? `${id}-err` : hint ? `${id}-hint` : undefined);

export function TextField({ label, error, hint, className, ...props }) {
  const auto = useId();
  const id = props.id || auto;
  return (
    <Field label={label} error={error} hint={hint} id={id} className={className}>
      <input className="input" id={id} aria-invalid={error ? "true" : undefined} aria-describedby={describe(id, error, hint)} {...props} />
    </Field>
  );
}

export function SelectField({ label, error, hint, className, children, ...props }) {
  const auto = useId();
  const id = props.id || auto;
  return (
    <Field label={label} error={error} hint={hint} id={id} className={className}>
      <select className="select" id={id} aria-invalid={error ? "true" : undefined} aria-describedby={describe(id, error, hint)} {...props}>
        {children}
      </select>
    </Field>
  );
}

export function TextAreaField({ label, error, hint, className, ...props }) {
  const auto = useId();
  const id = props.id || auto;
  return (
    <Field label={label} error={error} hint={hint} id={id} className={className}>
      <textarea className="textarea" id={id} aria-invalid={error ? "true" : undefined} aria-describedby={describe(id, error, hint)} {...props} />
    </Field>
  );
}
