"use client";

import { motion } from "framer-motion";

interface LoadingBarsProps {
  label?: string;
  barColor?: string;
  textColor?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingBars({
  label = "fetching meta data",
  barColor = "bg-black",
  textColor = "text-slate-400",
  size = "sm",
}: LoadingBarsProps) {
  const sizeConfig = {
    sm: {
      barWidth: "w-0.5",
      barHeight: "12px",
      fontSize: "text-[10px]",
      gap: "gap-0.5",
      padding: "px-2.5 py-1.5",
      spacing: "gap-1.5",
    },
    md: {
      barWidth: "w-1",
      barHeight: "16px",
      fontSize: "text-xs",
      gap: "gap-1",
      padding: "px-3 py-2",
      spacing: "gap-2",
    },
    lg: {
      barWidth: "w-1.5",
      barHeight: "20px",
      fontSize: "text-sm",
      gap: "gap-1.5",
      padding: "px-4 py-2.5",
      spacing: "gap-2.5",
    },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={`${config.padding} rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-sm border border-gray-200/50 dark:border-gray-700/50 flex items-center ${config.spacing}`}
    >
      <div className={`flex ${config.gap}`}>
        <motion.div
          className={`${config.barWidth} ${barColor} rounded-full`}
          animate={{ scaleY: [0.33, 1, 0.33] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0, ease: "easeInOut" }}
          style={{ height: config.barHeight, transformOrigin: "center" }}
        />
        <motion.div
          className={`${config.barWidth} ${barColor} rounded-full`}
          animate={{ scaleY: [0.33, 1, 0.33] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.15, ease: "easeInOut" }}
          style={{ height: config.barHeight, transformOrigin: "center" }}
        />
        <motion.div
          className={`${config.barWidth} ${barColor} rounded-full`}
          animate={{ scaleY: [0.33, 1, 0.33] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.3, ease: "easeInOut" }}
          style={{ height: config.barHeight, transformOrigin: "center" }}
        />
      </div>
      {label && (
        <span className={`${config.fontSize} font-medium ${textColor}`}>
          {label}
        </span>
      )}
    </div>
  );
}
