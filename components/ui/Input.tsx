import { useId } from "react";
import type { InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export default function Input({
  id,
  name,
  label,
  error,
  helperText,
  className,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id || name || generatedId;
  const inputClasses = ["ui-input", className].filter(Boolean).join(" ");

  return (
    <div className="ui-field">
      {label ? (
        <label className="ui-label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}

      <input id={inputId} name={name} className={inputClasses} {...props} />

      {error ? <p className="ui-error">{error}</p> : null}
      {!error && helperText ? <p className="ui-helper">{helperText}</p> : null}
    </div>
  );
}
