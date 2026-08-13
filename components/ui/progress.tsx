"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  className2?: string;
}

function Progress({ className = "", className2 = "", value, ...props }: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      dir="rtl"
      data-slot="progress"
      className={cn(
        "relative h-full w-full overflow-hidden rounded-full bg-gray-200", // container rounded
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("h-full transition-all rounded-full", className2)}
        style={{ transform: `translateX(${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
