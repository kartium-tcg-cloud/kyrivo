"use client";

import { useEffect, useRef, useState } from "react";

type Direction = "up" | "left" | "right" | "scale" | "none";

const HIDDEN_CLASSES: Record<Direction, string> = {
  up: "opacity-0 translate-y-6",
  left: "opacity-0 -translate-x-6",
  right: "opacity-0 translate-x-6",
  scale: "opacity-0 scale-95",
  none: "opacity-0",
};

const VISIBLE_CLASSES = "opacity-100 translate-y-0 translate-x-0 scale-100";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: Direction;
  className?: string;
}

export default function Reveal({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal transition-all duration-700 ease-out ${
        visible ? VISIBLE_CLASSES : HIDDEN_CLASSES[direction]
      } ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
