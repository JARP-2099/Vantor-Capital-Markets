import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Shared data-table language. One visual voice for every table in the
 * product: quiet uppercase header on a mist rule, hairline row dividers,
 * right-aligned tabular numerals. Admin surfaces pass `dense`.
 */

export function TableWrap({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border border-line bg-paper shadow-card",
        className,
      )}
      {...props}
    />
  );
}

export function Table({ className, ...props }: ComponentPropsWithoutRef<"table">) {
  return <table className={cn("w-full border-collapse text-sm", className)} {...props} />;
}

export function THead({ className, ...props }: ComponentPropsWithoutRef<"thead">) {
  return (
    <thead
      className={cn("border-b border-line-strong bg-mist/60 text-left", className)}
      {...props}
    />
  );
}

export function TBody({ className, ...props }: ComponentPropsWithoutRef<"tbody">) {
  return <tbody className={cn("divide-y divide-line", className)} {...props} />;
}

type THProps = ComponentPropsWithoutRef<"th"> & { numeric?: boolean; dense?: boolean };

export function TH({ className, numeric, dense, ...props }: THProps) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap px-4 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted",
        dense ? "py-2" : "py-2.5",
        numeric && "text-right",
        className,
      )}
      {...props}
    />
  );
}

type TDProps = ComponentPropsWithoutRef<"td"> & { numeric?: boolean; dense?: boolean };

export function TD({ className, numeric, dense, ...props }: TDProps) {
  return (
    <td
      className={cn(
        "px-4 text-sm text-slate-650",
        dense ? "py-2" : "py-3",
        numeric && "text-right tabular-nums",
        className,
      )}
      {...props}
    />
  );
}
