import { ButtonHTMLAttributes, FC, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export const Button: FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  className,
  children,
  disabled,
  ...props
}) => {
  const variants = {
    primary: "bg-black text-white hover:bg-slate-800",
    secondary: "border border-slate-300 text-slate-700 hover:bg-slate-50",
    ghost: "text-slate-700 hover:bg-slate-100",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  const sizes = {
    sm: "px-6 py-1.5 text-sm",
    md: "px-8 py-2 text-base",
    lg: "px-10 py-3 text-lg",
  };

  return (
    <button
      className={cn(
        "rounded-full font-medium transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "transform active:scale-95",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
