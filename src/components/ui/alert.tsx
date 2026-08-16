import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "error" | "warn";

const tones: Record<Tone, string> = {
  info: "border-line-strong bg-mist text-slate-650",
  success: "border-positive-700/30 bg-positive-50 text-positive-700",
  error: "border-negative-700/30 bg-negative-50 text-negative-700",
  warn: "border-warn-700/30 bg-warn-50 text-warn-700",
};

type AlertProps = {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
};

export function Alert({ tone = "info", title, children, className }: AlertProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-md border px-4 py-3 text-sm", tones[tone], className)}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={cn(title && "mt-1")}>{children}</div> : null}
    </div>
  );
}
