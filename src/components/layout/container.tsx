import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type ContainerProps = ComponentPropsWithoutRef<"div"> & {
  /** marketing: 1320px max; product: 1440px for data-dense app surfaces. */
  size?: "marketing" | "product";
};

export function Container({ className, size = "marketing", ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        size === "product" ? "max-w-[1440px]" : "max-w-[1320px]",
        className,
      )}
      {...props}
    />
  );
}
