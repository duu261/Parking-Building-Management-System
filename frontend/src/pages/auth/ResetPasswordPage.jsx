import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthShell from "./AuthShell";
import { Field, Input, Button, Alert } from "../../components/ui";
import { authApi } from "../../lib/endpoints";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!password) errs.password = "Password is required";
    else if (password.length < 8) errs.password = "Password must be at least 8 characters";
    if (!confirm) errs.confirm = "Please confirm your password";
    else if (password !== confirm) errs.confirm = "Passwords do not match";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const clearError = (field) => {
    if (fieldErrors[field]) setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setError("");
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
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
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-accent transition-colors"
      aria-label={showPw ? "Hide password" : "Show password"}
    >
      {showPw ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      )}
    </button>
  );

  if (!token) {
    return (
      <AuthShell title="Invalid link" subtitle="This reset link is missing or malformed.">
        <Link to="/forgot-password" className="text-sm font-medium text-white/55 hover:text-white no-underline transition-colors duration-200">
          Request a new reset link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set new password"
      subtitle="Choose a new password for your account."
      footer={
        <>
          Remember your password?{" "}
          <Link to="/login" className="font-medium text-white/55 hover:text-white no-underline transition-colors duration-200">
            Sign in
          </Link>
        </>
      }
    >
      {done ? (
        <div className="space-y-3">
          <div className="rounded-[var(--radius)] border border-green-500/30 bg-green-500/5 p-4 text-sm text-text">
            Your password has been reset successfully.
          </div>
          <Link to="/login" className="inline-block text-sm font-medium text-white/55 hover:text-white no-underline transition-colors duration-200">
            Sign in with your new password
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="New password" error={fieldErrors.password}>
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
                autoComplete="new-password"
                hasError={!!fieldErrors.password}
                className="pr-10"
              />
              {EyeToggle}
            </div>
          </Field>
          <Field label="Confirm password" error={fieldErrors.confirm}>
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); clearError("confirm"); }}
                autoComplete="new-password"
                hasError={!!fieldErrors.confirm}
                className="pr-10"
              />
              {EyeToggle}
            </div>
          </Field>
          <Alert>{error}</Alert>
          <Button type="submit" loading={loading} className="w-full">
            Reset password
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
