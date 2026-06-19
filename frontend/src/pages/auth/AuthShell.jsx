import { SquareParking } from "lucide-react";
import { Link } from "react-router-dom";

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-[100dvh] bg-bg text-text">
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:border-r lg:border-line lg:p-12">
        <Link to="/" className="inline-flex items-center gap-2 transition hover:opacity-80">
          <SquareParking className="text-text" size={24} />
          <span className="text-lg font-semibold tracking-tight">ParkMaster</span>
        </Link>
        <div>
          <h2 className="max-w-sm text-3xl font-semibold leading-tight tracking-tight">
            Every slot, every session, in one quiet view.
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Live availability, smart allocation, and role-based control for your parking building.
          </p>
        </div>
        <p className="text-xs text-muted">FPT University - SWP391 Capstone</p>
      </div>

      <div className="grid-paper flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-6 inline-flex items-center gap-2 transition hover:opacity-80 lg:hidden">
            <SquareParking className="text-text" size={24} />
            <span className="text-lg font-semibold tracking-tight">ParkMaster</span>
          </Link>
          <div className="rounded-[var(--radius)] border border-line bg-surface p-6 shadow-[var(--shadow-pop)]">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
          {footer && <div className="mt-4 text-center text-sm text-muted lg:text-left">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
