import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type ContainerProps = ComponentPropsWithoutRef<"div"> & {
  /** Product data surfaces may go wider than marketing content. */
  wide?: boolean;
};

export function Container({ className, wide = false, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        wide ? "max-w-screen-2xl" : "max-w-7xl",
        className,
      )}
      {...props}
    />
  );
}
