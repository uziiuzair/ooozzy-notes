import { FC, ReactNode, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useProximityEffect } from "@/hooks/useProximityEffect";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
  enableProximity?: boolean;
}

export const Card: FC<CardProps> = ({
  className,
  children,
  onClick,
  hoverable = false,
  enableProximity = true,
  ...props
}) => {
  const { ref, proximity } = useProximityEffect(200);

  // // Calculate directional shadow based on mouse position
  // const shadowX = proximity.intensity > 0 ? (proximity.x - 50) / 10 : 0;
  // const shadowY = proximity.intensity > 0 ? (proximity.y - 50) / 10 : 0;

  // Clamp proximity position to card edges for border effect
  const clampedX = Math.max(0, Math.min(100, proximity.x));
  const clampedY = Math.max(0, Math.min(100, proximity.y));

  const proximityStyle =
    enableProximity && proximity.intensity > 0
      ? {
          background: `
          radial-gradient(
            circle at ${clampedX}% ${clampedY}%,
            rgba(92, 113, 110, ${proximity.intensity * 0.6}) 0%,
            rgba(92, 113, 110, ${proximity.intensity * 0.3}) 10%,
            rgba(255, 255, 255, ${proximity.intensity * 0.8}) 20%,
            white 30%
          )
        `,
        }
      : {
          background: "white",
        };

  return (
    <div
      ref={ref}
      className={cn(
        "relative p-px rounded-[9px] border border-slate-200 transition-all duration-300",
        hoverable && "hover:scale-[1.02] cursor-pointer",
        onClick && "cursor-pointer",
        className
      )}
      style={proximityStyle}
      onClick={onClick}
      {...props}
    >
      {/* Inner container with white background and backdrop blur */}
      <div className="relative w-full h-full bg-white backdrop-blur-md rounded-lg p-4 transition-all duration-300">
        {children}
      </div>
    </div>
  );
};
