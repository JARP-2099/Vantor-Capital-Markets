import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

/**
 * Standard form field wrapper: label, control, hint, and screen-reader
 * friendly error. Pass `aria-describedby={`${id}-error`}` on the control
 * when rendering an error for full SR support.
 */
export function Field({ label, htmlFor, hint, error, required, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-900">
        {label}
        {required ? <span className="text-negative-700 ml-0.5" aria-hidden="true">*</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-muted">{hint}</p> : null}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs font-medium text-negative-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
