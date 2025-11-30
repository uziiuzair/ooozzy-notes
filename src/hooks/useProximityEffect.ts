import { useEffect, useRef, useState } from "react";

interface ProximityState {
  x: number;
  y: number;
  intensity: number;
}

export const useProximityEffect = (maxDistance: number = 250) => {
  const ref = useRef<HTMLDivElement>(null);
  const [proximity, setProximity] = useState<ProximityState>({
    x: 0,
    y: 0,
    intensity: 0,
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      // const centerX = rect.left + rect.width / 2;
      // const centerY = rect.top + rect.height / 2;

      // Calculate mouse position relative to element center
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // Find the closest point on the rectangle to the mouse
      const closestX = Math.max(rect.left, Math.min(mouseX, rect.right));
      const closestY = Math.max(rect.top, Math.min(mouseY, rect.bottom));

      // Calculate distance from mouse to closest point
      const distance = Math.sqrt(
        Math.pow(mouseX - closestX, 2) + Math.pow(mouseY - closestY, 2)
      );

      // Calculate intensity based on distance (0 to 1)
      const intensity = Math.max(0, 1 - distance / maxDistance);

      // Calculate the angle from center to mouse for gradient direction
      // const angleRad = Math.atan2(mouseY - centerY, mouseX - centerX);
      // const angleDeg = (angleRad * 180) / Math.PI;

      // Calculate position on border where the glow should be strongest
      // This is the intersection of the line from center to mouse with the border
      const relativeX = ((mouseX - rect.left) / rect.width) * 100;
      const relativeY = ((mouseY - rect.top) / rect.height) * 100;

      setProximity({
        x: Math.max(0, Math.min(100, relativeX)),
        y: Math.max(0, Math.min(100, relativeY)),
        intensity,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [maxDistance]);

  return { ref, proximity };
};
