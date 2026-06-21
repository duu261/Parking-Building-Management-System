import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthShell from "./AuthShell";
import { Field, Input, Button, Alert } from "../../components/ui";
import { authApi } from "../../lib/endpoints";
import { setSession, isAuthed, getUser, homePathForRole } from "../../lib/session";

export default function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthed()) return <Navigate to={homePathForRole(getUser()?.role)} replace />;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== confirmPw) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const auth = await authApi.register(form);
      setSession(auth);
      navigate(homePathForRole(auth.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const EyeToggle = (
    <button
      type="button"
      onClick={() => setShowPw(!showPw)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg transition-colors"
      aria-label={showPw ? "Hide password" : "Show password"}
    >
      {showPw ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      )}
    </button>
  );

  return (
    <AuthShell
      title="Create account"
      subtitle="Register as a driver to reserve and track parking."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name">
          <Input value={form.fullName} onChange={set("fullName")} maxLength={120} required />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={set("email")} autoComplete="email" required />
        </Field>
        <Field label="Password">
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={set("password")}
              autoComplete="new-password"
              minLength={8}
              required
              className="pr-10"
            />
            {EyeToggle}
          </div>
        </Field>
        <Field label="Confirm password">
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              className="pr-10"
            />
            {EyeToggle}
          </div>
        </Field>
        <Alert>{error}</Alert>
        <Button type="submit" loading={loading} className="w-full">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
