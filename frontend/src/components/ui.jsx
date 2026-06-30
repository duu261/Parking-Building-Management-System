import { Loader2, AlertCircle } from "lucide-react";
import { STATUS_COLOR } from "../lib/status";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

// Shape lock: surfaces and controls use the --radius scale; only dots/chips go full.
const RADIUS = "rounded-[var(--radius)]";

export function Button({ variant = "primary", className, disabled, loading, children, ...rest }) {
  const base = cx(
    "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition",
    RADIUS,
    "active:translate-y-px disabled:opacity-50 disabled:pointer-events-none",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-text/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
  );
  const variants = {
    primary: "bg-accent text-accent-fg shadow-[var(--shadow-card)] hover:opacity-90",
    secondary: "border border-line bg-surface text-text hover:bg-elevated",
    ghost: "text-muted hover:bg-elevated hover:text-text",
  };
  return (
    <button type="button" className={cx(base, variants[variant], className)} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

export function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      {children}
      {error && (
        <span className="mt-1.5 flex items-center gap-1 text-xs text-rose-400">
          <AlertCircle size={12} className="shrink-0" />
          <span>{error}</span>
        </span>
      )}
    </label>
  );
}

const controlClass = cx(
  "w-full border border-line bg-surface px-3 py-2 text-sm text-text outline-none transition",
  RADIUS,
  "placeholder:text-muted/70 focus:border-text/40 focus:ring-2 focus:ring-text/15 disabled:opacity-50",
);

export function Input({ className, hasError, ...rest }) {
  return (
    <input
      className={cx(
        controlClass,
        className,
        hasError && "border-rose-400/60 focus:border-rose-400 focus:ring-rose-400/30",
      )}
      {...rest}
    />
  );
}

export function Textarea({ className, ...rest }) {
  return <textarea className={cx(controlClass, "resize-y", className)} {...rest} />;
}

export function Select({ className, children, ...rest }) {
  return (
    <select className={cx(controlClass, "select-chevron appearance-none pr-9", className)} {...rest}>
      {children}
    </select>
  );
}

export function Card({ className, children }) {
  return (
    <div className={cx("border border-line bg-surface shadow-[var(--shadow-card)]", RADIUS, className)}>
      {children}
    </div>
  );
}

export function StatusBadge({ status }) {
  const color = STATUS_COLOR[status] ?? "var(--muted)";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide"
      style={{ color, borderColor: `color-mix(in oklab, ${color} 35%, transparent)`, backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)` }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {status}
    </span>
  );
}

export function Spinner({ label = "Loading" }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      <Loader2 size={16} className="animate-spin" />
      {label}
    </div>
  );
}

// Skeleton rows that match the final list shape, per the interactive-states rule.
export function Skeleton({ rows = 3 }) {
  return (
    <div className={cx("divide-y divide-line border border-line bg-surface", RADIUS)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5">
          <div className="h-3.5 w-28 animate-pulse rounded bg-elevated" />
          <div className="h-3 w-40 animate-pulse rounded bg-elevated" />
          <div className="ml-auto h-8 w-24 animate-pulse rounded bg-elevated" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className={cx("flex flex-col items-center justify-center border border-dashed border-line py-14 text-center", RADIUS)}>
      {Icon && (
        <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-elevated text-muted">
          <Icon size={22} />
        </span>
      )}
      <p className="font-medium">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}

export function Alert({ children }) {
  if (!children) return null;
  return (
    <div className={cx("border border-occupied/30 bg-occupied/10 px-3 py-2 text-sm text-occupied", RADIUS)}>
      {children}
    </div>
  );
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
