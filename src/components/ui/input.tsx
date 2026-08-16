import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

/* Dark form fields: surface panel, hairline border, readable text. */
const fieldBase =
  "w-full rounded-md border border-line-strong bg-mist px-3 text-ink-900 placeholder:text-faint " +
  "hover:border-faint focus:border-brand transition-colors " +
  "aria-[invalid=true]:border-negative-700 disabled:bg-paper disabled:text-muted";

export function Input({ className, ...props }: ComponentPropsWithoutRef<"input">) {
  return <input className={cn(fieldBase, "h-10 text-sm", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentPropsWithoutRef<"textarea">) {
  return (
    <textarea
      className={cn(fieldBase, "min-h-28 py-2.5 text-sm leading-relaxed", className)}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: ComponentPropsWithoutRef<"select">) {
  return (
    <select className={cn(fieldBase, "h-10 text-sm appearance-none pr-8 bg-no-repeat bg-[position:right_0.6rem_center] bg-[length:1rem] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%23777a88%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')]", className)} {...props}>
      {children}
    </select>
  );
}
