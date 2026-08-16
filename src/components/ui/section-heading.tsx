import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  /** Small uppercase kicker above the title (optional). */
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  /** Right-aligned actions (buttons/links), wraps below on mobile. */
  actions?: ReactNode;
  /** Heading level for the title. */
  as?: "h1" | "h2" | "h3";
  id?: string;
  className?: string;
};

/** Standard product section header: eyebrow, title, description, actions. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  actions,
  as: Tag = "h2",
  id,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-3", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">{eyebrow}</p>
        ) : null}
        <Tag
          id={id}
          className={cn(
            "text-ink-900 tracking-tight",
            Tag === "h1" ? "text-2xl font-semibold sm:text-3xl" : "text-lg font-semibold",
            eyebrow && "mt-1",
          )}
        >
          {title}
        </Tag>
        {description ? (
          <div className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{description}</div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
