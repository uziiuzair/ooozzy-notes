import { FC, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TypographyProps {
  variant?: "h1" | "h2" | "h3" | "h4" | "body" | "caption" | "label";
  className?: string;
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

export const Typography: FC<TypographyProps> = ({
  variant = "body",
  className,
  children,
  as,
}) => {
  const variants = {
    h1: "text-4xl font-bold text-gray-900",
    h2: "text-3xl font-semibold text-gray-900",
    h3: "text-2xl font-semibold text-gray-900",
    h4: "text-xl font-semibold text-gray-900",
    body: "text-base text-gray-700",
    caption: "text-sm text-gray-500",
    label: "text-sm font-medium text-gray-700",
  };

  const defaultTags = {
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    body: "p",
    caption: "span",
    label: "label",
  };

  const Component = (as || defaultTags[variant]) as keyof JSX.IntrinsicElements;

  return (
    <Component className={cn(variants[variant], className)}>
      {children}
    </Component>
  );
};
