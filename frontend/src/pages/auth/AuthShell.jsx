import { SquareParking } from "lucide-react";

// Shared frame for login / signup.
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid-paper flex min-h-[100dvh] items-center justify-center bg-bg px-4 text-text">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <SquareParking className="text-text" size={24} />
          <span className="text-lg font-semibold tracking-tight">ParkMaster</span>
        </div>
        <div className="rounded-[var(--radius)] border border-line bg-surface p-6 shadow-[var(--shadow-pop)]">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-4 text-center text-sm text-muted">{footer}</div>}
      </div>
    </div>
  );
}
