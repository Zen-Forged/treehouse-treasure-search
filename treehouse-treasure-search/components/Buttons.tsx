"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
}

export function PrimaryButton({
  children,
  fullWidth = false,
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-body font-semibold rounded-xl transition-all duration-150 active:scale-95",
        "bg-forest-500 hover:bg-forest-400 text-white",
        "disabled:opacity-40 disabled:pointer-events-none",
        {
          "w-full": fullWidth,
          "text-sm px-4 py-2.5": size === "sm",
          "text-base px-5 py-3.5": size === "md",
          "text-lg px-6 py-4": size === "lg",
        },
        className
      )}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  fullWidth = false,
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-body font-medium rounded-xl transition-all duration-150 active:scale-95",
        "border border-forest-700 text-bark-200 hover:bg-forest-900 hover:border-forest-600",
        "disabled:opacity-40 disabled:pointer-events-none",
        {
          "w-full": fullWidth,
          "text-sm px-4 py-2.5": size === "sm",
          "text-base px-5 py-3.5": size === "md",
          "text-lg px-6 py-4": size === "lg",
        },
        className
      )}
    >
      {children}
    </button>
  );
}

export function DangerButton({
  children,
  fullWidth = false,
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-body font-semibold rounded-xl transition-all duration-150 active:scale-95",
        "bg-red-900/60 hover:bg-red-800/70 text-red-300 border border-red-800/50",
        "disabled:opacity-40 disabled:pointer-events-none",
        {
          "w-full": fullWidth,
          "text-sm px-4 py-2.5": size === "sm",
          "text-base px-5 py-3.5": size === "md",
          "text-lg px-6 py-4": size === "lg",
        },
        className
      )}
    >
      {children}
    </button>
  );
}
