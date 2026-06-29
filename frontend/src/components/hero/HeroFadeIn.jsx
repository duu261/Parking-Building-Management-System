import { motion, useReducedMotion } from "framer-motion";

const ease = [0.25, 0.1, 0.25, 1];

export default function HeroFadeIn({
  children,
  className,
  delay = 0,
  duration = 0.7,
  y = 30,
  x = 0,
  amount = 0.15,
}) {
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "50px", amount }}
      transition={{ duration, delay, ease }}
    >
      {children}
    </motion.div>
  );
}
