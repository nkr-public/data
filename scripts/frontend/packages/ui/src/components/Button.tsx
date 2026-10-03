import * as React from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  secondary: "bg-surface text-foreground border border-border hover:bg-border/40",
  outline: "bg-transparent text-foreground border border-border hover:bg-surface",
  danger: "bg-danger text-primary-foreground hover:opacity-90",
  ghost: "bg-transparent text-foreground hover:bg-surface",
};

export function Button({ variant = "primary", isLoading, className = "", children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? "..." : children}
    </button>
  );
}
