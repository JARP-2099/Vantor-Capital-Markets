import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "ink" | "inverse";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors " +
  "disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  /** Brand action — the one cobalt element on most screens. */
  primary: "bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-700",
  secondary:
    "bg-paper text-ink-900 border border-line-strong hover:border-faint hover:bg-canvas active:bg-mist",
  ghost: "text-ink-900 hover:bg-mist active:bg-line",
  danger: "bg-negative-700 text-white hover:opacity-90",
  /** Near-black — marketing emphasis and admin chrome. */
  ink: "bg-ink-900 text-white hover:bg-ink-700 active:bg-ink-950",
  /** For dark (ink) surfaces only. */
  inverse: "bg-white text-ink-900 hover:bg-canvas active:bg-mist",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: Variant;
  size?: Size;
};

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props} />
  );
}

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  variant?: Variant;
  size?: Size;
};

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonLinkProps) {
  return <Link className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
