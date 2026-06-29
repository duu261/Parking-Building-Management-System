import { useRef, useState, useCallback } from "react";

export default function SpotlightText({ text, className = "", style }) {
  const ref = useRef(null);
  const [mouse, setMouse] = useState({ x: -999, y: -999 });
  const [hovering, setHovering] = useState(false);

  const isTouch =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  const onMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const onMouseEnter = useCallback(() => setHovering(true), []);
  const onMouseLeave = useCallback(() => {
    setHovering(false);
    setMouse({ x: -999, y: -999 });
  }, []);

  const r = 140;
  const cx = mouse.x;
  const cy = mouse.y;
  const mask = hovering
    ? `radial-gradient(circle ${r}px at ${cx}px ${cy}px, black 0%, black 35%, transparent 75%)`
    : "radial-gradient(circle 0px at 0px 0px, black 0%, transparent 100%)";

  if (isTouch) {
    return (
      <p className={className} style={{ ...style, color: "rgba(255,255,255,0.6)" }}>
        {text}
      </p>
    );
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <p className={className} style={{ ...style, color: "rgba(255,255,255,0.3)" }}>
        {text}
      </p>
      <p
        className={`${className} absolute inset-0 pointer-events-none`}
        style={{
          ...style,
          color: "rgba(255,255,255,0.92)",
          maskImage: mask,
          WebkitMaskImage: mask,
          transition: hovering
            ? "mask-image 0.08s ease, -webkit-mask-image 0.08s ease"
            : "mask-image 0.4s ease, -webkit-mask-image 0.4s ease",
        }}
        aria-hidden="true"
      >
        {text}
      </p>
    </div>
  );
}
