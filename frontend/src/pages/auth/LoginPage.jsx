import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import AuthShell from "./AuthShell";
import { Field, Input, Button, Alert } from "../../components/ui";
import { authApi } from "../../lib/endpoints";
import { setSession, setStayLoggedIn, isAuthed, getUser, homePathForRole } from "../../lib/session";

const INPUT_CLASS = "bg-white/[0.06] border-white/10 text-white placeholder:text-white/35 h-11 py-2.5 rounded-xl hover:border-white/20 focus:border-white/35 focus:ring-2 focus:ring-white/15";
const BTN_CLASS = "w-full bg-white text-black h-12 rounded-xl font-semibold duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(255,255,255,0.14)] hover:bg-white/90 active:translate-y-0 disabled:opacity-60";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthed()) return <Navigate to={homePathForRole(getUser()?.role)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const auth = await authApi.login({ email, password });
      setSession(auth);
      setStayLoggedIn(keepLoggedIn);
      navigate(homePathForRole(auth.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Access your ParkMaster account."
      footer={
        <>
          No account?{" "}
          <Link to="/signup" className="font-medium text-white/60 hover:text-white transition-colors duration-200 no-underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <Field label="Email">
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/45"
            />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              required
              className={`${INPUT_CLASS} pl-10 pr-4`}
            />
          </div>
        </Field>
        <Field label="Password">
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/45"
            />
            <Input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
              required
              className={`${INPUT_CLASS} pl-10 pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white transition-colors cursor-pointer"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
        </Field>
        <div className="flex items-center justify-between -mt-1">
          <button
            type="button"
            onClick={() => setKeepLoggedIn((v) => !v)}
            className="flex items-center gap-2 select-none py-2 text-left"
          >
            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${keepLoggedIn ? "bg-white border-white" : "border-white/30"}`}>
              {keepLoggedIn && (
                <svg viewBox="0 0 10 8" className="w-2.5 h-2.5" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1,4 3.5,6.5 9,1" />
                </svg>
              )}
            </div>
            <span className="text-xs text-white/55">Stay logged in</span>
          </button>
          <Link to="/forgot-password" className="text-xs text-white/55 hover:text-white transition-colors duration-200 no-underline">
            Forgot password?
          </Link>
        </div>
        <Alert>{error}</Alert>
        <Button type="submit" loading={loading} className={BTN_CLASS}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
