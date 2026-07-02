import { SquareParking, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div
      className="min-h-dvh relative flex items-center justify-center p-4 sm:p-6 overflow-x-hidden"
      style={{
        "--muted-foreground": "0 0% 58%",
        "--foreground": "0 0% 96%",
        backgroundColor: "hsl(0 0% 4%)",
        color: "hsl(0 0% 96%)",
        fontFamily: '"Inter", sans-serif',
      }}
    >
      <style>{`
        body {
          background-color: hsl(0 0% 4%) !important;
        }
        #root {
          background-color: hsl(0 0% 4%);
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #ffffff;
          -webkit-box-shadow: 0 0 0px 1000px rgba(20,20,25,0.95) inset;
          transition: background-color 5000s ease-in-out 0s;
          caret-color: #ffffff;
        }
      `}</style>
      {/* Grid overlay */}
      <div className="absolute inset-0 grid-paper opacity-[0.05] pointer-events-none" />

      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(56,189,248,0.04) 0%, transparent 60%)",
        }}
      />

      {/* Logo top-left */}
      <Link
        to="/"
        className="absolute top-5 left-5 sm:top-6 sm:left-6 inline-flex items-center gap-2 no-underline hover:opacity-75 transition-opacity z-20"
        style={{ color: "hsl(var(--foreground))" }}
      >
        <SquareParking size={20} />
        <span className="text-sm font-semibold tracking-tight">ParkMaster</span>
      </Link>

      {/* Back to home top-right */}
      <Link
        to="/"
        className="absolute top-5 right-5 sm:top-6 sm:right-6 inline-flex items-center gap-1.5 text-sm text-white/35 hover:text-white no-underline transition-colors duration-200 z-20"
      >
        <ArrowLeft size={14} />
        <span className="hidden sm:inline">Back to home</span>
      </Link>

      {/* ───── Auth card ───── */}
      <div
        className="w-[min(1120px,calc(100vw-32px))] sm:w-[min(1120px,calc(100vw-48px))] lg:min-h-[min(620px,calc(100dvh-48px))] rounded-[28px] sm:rounded-[32px] overflow-hidden border flex relative z-10 shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
        style={{
          backgroundColor: "rgba(255,255,255,0.04)",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        {/* ─── Left: Image panel (desktop) ─── */}
        <div className="hidden lg:block w-1/2 relative overflow-hidden">
          <img
            src="/images/parking.png"
            alt="ParkMaster parking system preview"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />
        </div>

        {/* ─── Right: Form panel ─── */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-10 lg:px-12 lg:py-10">
          <div className="w-full max-w-md">
            {/* Mobile image */}
            <div className="lg:hidden relative mb-6 rounded-2xl overflow-hidden">
              <img
                src="/images/parking.png"
                alt="ParkMaster parking system preview"
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
            </div>

            {/* Title */}
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                {subtitle}
              </p>
            )}

            {/* Form content */}
            <div className="mt-8">{children}</div>

            {/* Footer links */}
            {footer && (
              <div className="mt-6 text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
