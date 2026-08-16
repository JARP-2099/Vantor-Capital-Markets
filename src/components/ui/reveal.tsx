"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type RevealProps = {
  children: ReactNode;
  /** Stagger delay in ms, applied via transition-delay. */
  delay?: number;
  /** Render element; defaults to div. */
  as?: "div" | "section" | "li" | "span" | "ul" | "ol";
  className?: string;
};

/**
 * Scroll-into-view reveal for MARKETING surfaces. Renders children visible
 * by default (no-JS and reduced-motion users see everything); when motion is
 * allowed, content starts translated/faded and transitions in the first time
 * it enters the viewport. Product data surfaces should not use this.
 *
 * The wrapper also exposes `data-reveal-state` so descendants can join the
 * reveal with CSS hooks (globals.css): `.reveal-child` fades/rises with the
 * wrapper (use inline `transitionDelay` to stagger) and `.reveal-bar` scales
 * horizontally from zero — for range bars and completeness meters.
 */
export function Reveal({ children, delay = 0, as: Tag = "div", className }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<"initial" | "hidden" | "shown">("initial");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Already in view on mount (above the fold): skip the entrance.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) return;

    setState("hidden");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setState("shown");
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      data-reveal-state={state}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
        state === "hidden" && "translate-y-5 opacity-0",
        state === "shown" && "translate-y-0 opacity-100",
        className,
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
