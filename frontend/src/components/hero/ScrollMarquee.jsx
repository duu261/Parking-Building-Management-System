import { useEffect, useRef, useState, useCallback } from "react";

export default function ScrollMarquee({ children, direction = "right", speed = 0.12 }) {
  const sectionRef = useRef(null);
  const innerRef = useRef(null);
  const [offset, setOffset] = useState(0);

  const handleScroll = useCallback(() => {
    const el = sectionRef.current;
    const inner = innerRef.current;
    if (!el || !inner) return;

    const rect = el.getBoundingClientRect();
    const sectionTop = rect.top + window.scrollY;
    const raw = (window.scrollY - sectionTop + window.innerHeight) * speed;

    const halfW = inner.scrollWidth / 3;
    setOffset(raw % halfW);
  }, [speed]);

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const dir = direction === "right" ? 1 : -1;

  return (
    <div ref={sectionRef}>
      <div
        ref={innerRef}
        className="flex gap-4 sm:gap-5"
        style={{ transform: `translateX(${dir * offset}px)`, willChange: "transform" }}
      >
        {children}
        {children}
        {children}
      </div>
    </div>
  );
}
